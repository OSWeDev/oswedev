import debounce from 'lodash/debounce';
import { Component, Prop, Watch } from "vue-property-decorator";
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ModuleSendInBlue from '../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './AccessPolicyResetComponent.scss';

@Component({
    template: require('./AccessPolicyResetComponent.pug')
})
export default class AccessPolicyResetComponent extends VueComponentBase {

    @Prop({ default: null })
    private prop_user_id: number;

    @Prop({ default: null })
    private prop_challenge: string;

    private is_simplified: boolean = false;

    private email: string = "";
    private challenge: string = "";
    private new_pwd1: string = "";

    private message: string = null;
    private status: boolean = false;
    private show_init_link: boolean = false;

    private redirect_to: string = "/";

    private debounced_load_props = debounce(this.load_props, 100);
    private logo_url: string = null;

    private has_sms_activation: boolean = false;

    @Watch('prop_user_id', { immediate: true })
    private onchange_prop_user_id() {
        if (!this.prop_user_id) {
            return;
        }

        this.debounced_load_props();
    }

    @Watch('prop_challenge', { immediate: true })
    private onchange_prop_challenge() {
        if (!this.prop_challenge) {
            return;
        }

        this.debounced_load_props();
    }

    private load_props() {
        if (!this.prop_challenge) {
            return;
        }
        if (!this.prop_user_id) {
            return;
        }

        this.is_simplified = true;
    }

    private async mounted() {
        this.load_logo_url();

        let logged_id: number = await ModuleAccessPolicy.getInstance().getLoggedUserId();
        if (!!logged_id) {
            window.location = this.redirect_to as any;
        }

        this.has_sms_activation =
            await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION) &&
            await ModuleParams.getInstance().getParamValueAsBoolean(ModuleAccessPolicy.PARAM_NAME_CAN_RECOVER_PWD_BY_SMS);
    }
    //     for (let j in this.$route.query) {
    //         switch (j) {
    //             case 'email':
    //                 this.email = this.$route.query[j];
    //                 break;
    //             case 'challenge':
    //                 this.challenge = this.$route.query[j];
    //                 break;
    //         }
    //     }
    // }

    private async reset() {
        this.snotify.info(this.label('reset.start'));

        let reset_res: boolean = false;
        if (this.is_simplified) {

            if (!await ModuleAccessPolicy.getInstance().checkCodeUID(this.prop_user_id, this.prop_challenge)) {
                this.message = this.label('login.reset.code_invalid');
                this.snotify.error(this.label('reset.code_invalid'));
                this.status = false;
                this.show_init_link = true;
                return;
            }
            reset_res = await ModuleAccessPolicy.getInstance().resetPwdUID(this.prop_user_id, this.prop_challenge, this.new_pwd1);
        } else {
            if (!await ModuleAccessPolicy.getInstance().checkCode(this.email, this.challenge)) {
                this.message = this.label('login.reset.code_invalid');
                this.snotify.error(this.label('reset.code_invalid'));
                this.status = false;
                this.show_init_link = true;
                return;
            }
            reset_res = await ModuleAccessPolicy.getInstance().resetPwd(this.email, this.challenge, this.new_pwd1);
        }

        this.show_init_link = false;
        if (reset_res) {
            this.snotify.success(this.label('reset.ok'));
            this.message = this.label('login.reset.answer_ok');
            this.status = true;
        } else {
            this.snotify.error(this.label('reset.failed'));
            if (!!this.is_simplified) {
                this.message = this.label('login.reset.answer_ko_simplified');
            } else {
                this.message = this.label('login.reset.answer_ko');
            }
            this.status = false;
        }
    }

    private async recover() {
        this.snotify.info(this.label('recover.start'));

        let recovered = false;
        if (this.is_simplified) {
            recovered = await ModuleAccessPolicy.getInstance().beginRecoverUID(this.prop_user_id);
        } else {
            recovered = await ModuleAccessPolicy.getInstance().beginRecover(this.email);
        }

        if (recovered) {
            this.snotify.success(this.label('recover.ok'));

            if (this.has_sms_activation) {
                this.message = this.label('login.recover.answercansms');
            } else {
                this.message = this.label('login.recover.answer');
            }

        } else {
            this.snotify.error(this.label('recover.failed'));
        }
    }

    private async recoversms() {
        this.snotify.info(this.label('recover.start'));

        let recovered = false;
        if (this.is_simplified) {
            recovered = await ModuleAccessPolicy.getInstance().beginRecoverSMSUID(this.prop_user_id);
        } else {
            recovered = await ModuleAccessPolicy.getInstance().beginRecoverSMS(this.email);
        }

        if (recovered) {
            this.snotify.success(this.label('recover.oksms'));
            this.message = this.label('login.recover.answersms');
        } else {
            this.snotify.error(this.label('recover.failed'));
        }
    }

    // private async send_init_pwd() {
    //     if (this.is_simplified) {
    //         await ModuleAccessPolicy.getInstance().begininitpwd_uid(this.prop_user_id);
    //     } else {
    //         await ModuleAccessPolicy.getInstance().begininitpwd(this.email);
    //     }
    //     this.snotify.success(this.label('reset.sent_init_pwd'));
    // }

    @Watch('email')
    private onchange_email() {
        this.show_init_link = false;
    }

    private async load_logo_url() {
        this.logo_url = await ModuleParams.getInstance().getParamValue(ModuleSASSSkinConfigurator.MODULE_NAME + '.logo_url');
        if (this.logo_url && (this.logo_url != '""') && (this.logo_url != '')) {
            return;
        }
        this.logo_url = null;
    }
}