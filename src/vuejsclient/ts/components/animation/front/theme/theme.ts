import { Component, Prop } from "vue-property-decorator";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import ModuleAnimation from "../../../../../../shared/modules/Animation/ModuleAnimation";
import ThemeModuleDataParamRangesVO from "../../../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataParamRangesVO";
import ThemeModuleDataRangesVO from "../../../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import VarDayPrctAtteinteSeuilAnimationController from "../../../../../../shared/modules/Animation/vars/VarDayPrctAtteinteSeuilAnimationController";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import AnimationUserModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import NumSegment from "../../../../../../shared/modules/DataRender/vos/NumSegment";
import DocumentVO from "../../../../../../shared/modules/Document/vos/DocumentVO";
import ISimpleNumberVarData from "../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData";
import IVarDataVOBase from "../../../../../../shared/modules/Var/interfaces/IVarDataVOBase";
import SimpleNumberVarDataController from "../../../../../../shared/modules/Var/simple_vars/SimpleNumberVarDataController";
import VarsController from "../../../../../../shared/modules/Var/VarsController";
import RangeHandler from "../../../../../../shared/tools/RangeHandler";
import VarDataRefComponent from '../../../Var/components/dataref/VarDataRefComponent';
import VueComponentBase from '../../../VueComponentBase';

@Component({
    template: require("./theme.pug"),
    components: {}
})
export default class VueAnimationThemeComponent extends VueComponentBase {

    @Prop()
    private theme: AnimationThemeVO;

    @Prop()
    private index_theme: number;

    @Prop()
    private modules: AnimationModuleVO[];

    @Prop()
    private logged_user_id: number;

    private prct_atteinte_seuil_theme: number = 0;
    private prct_atteinte_seuil_module: { [module_id: number]: number } = {};
    private is_ready: boolean = false;
    private um_by_module_id: { [module_id: number]: AnimationUserModuleVO } = {};
    private document_by_module_id: { [module_id: number]: DocumentVO } = {};

    private async mounted() {
        this.is_ready = false;

        let promises = [];

        for (let i in this.modules) {
            let anim_module: AnimationModuleVO = this.modules[i];

            promises.push((async () =>
                this.prct_atteinte_seuil_module[anim_module.id] = SimpleNumberVarDataController.getInstance().getValueOrDefault(
                    await VarsController.getInstance().registerDataParamAndReturnVarData<ThemeModuleDataParamRangesVO>(
                        this.get_prct_atteinte_seuil_module_param(anim_module.id), true
                    ) as ThemeModuleDataRangesVO,
                    0
                )
            )());
            promises.push((async () => this.um_by_module_id[anim_module.id] = await ModuleAnimation.getInstance().getUserModule(this.logged_user_id, anim_module.id))());

            if (anim_module.document_id) {
                promises.push((async () => this.document_by_module_id[anim_module.id] = await ModuleDAO.getInstance().getVoById<DocumentVO>(DocumentVO.API_TYPE_ID, anim_module.document_id))());
            }
        }

        await Promise.all(promises);

        this.is_ready = true;
    }

    private go_to_route_module(anim_module: AnimationModuleVO) {
        this.$router.push({
            name: AnimationController.ROUTE_NAME_ANIMATION_MODULE,
            params: {
                module_id: anim_module.id.toString(),
            }
        });
    }

    private get_class_prct_avancement_module(anim_module: AnimationModuleVO) {
        return {
            success: (this.prct_atteinte_seuil_module[anim_module.id] == 1),
            warning: (this.prct_atteinte_seuil_module[anim_module.id] == 0 && this.um_by_module_id[anim_module.id] && this.um_by_module_id[anim_module.id].end_date),
            not_start: !this.um_by_module_id[anim_module.id],
            en_cours: (this.um_by_module_id[anim_module.id] && !this.um_by_module_id[anim_module.id].end_date)
        }
    }

    private prct_atteinte_seuil_theme_value_callback(var_value: IVarDataVOBase, component: VarDataRefComponent): number {
        if (!component || !component.var_param.var_id) {
            return;
        }

        this.prct_atteinte_seuil_theme = (var_value as ISimpleNumberVarData).value;

        return this.prct_atteinte_seuil_theme;
    }

    private get_prct_atteinte_seuil_module_param(module_id: number): ThemeModuleDataParamRangesVO {
        return ThemeModuleDataParamRangesVO.createNew(
            VarDayPrctAtteinteSeuilAnimationController.getInstance().varConf.id,
            null,
            [RangeHandler.getInstance().create_single_elt_NumRange(module_id, NumSegment.TYPE_INT)],
            [RangeHandler.getInstance().create_single_elt_NumRange(this.logged_user_id, NumSegment.TYPE_INT)],
        );
    }

    get ordered_modules(): AnimationModuleVO[] {
        return (this.is_ready && this.modules) ? this.modules.sort((a, b) => {
            let res = this.prct_atteinte_seuil_module[a.id] - this.prct_atteinte_seuil_module[b.id];

            if (!res) {
                return a.weight - b.weight;
            }

            return res;
        }) : null;
    }

    get style_barre_avancement(): any {
        return {
            width: (this.prct_atteinte_seuil_theme * 100) + '%',
        };
    }

    get prct_atteinte_seuil_theme_param(): ThemeModuleDataParamRangesVO {
        return ThemeModuleDataParamRangesVO.createNew(
            VarDayPrctAtteinteSeuilAnimationController.getInstance().varConf.id,
            [RangeHandler.getInstance().create_single_elt_NumRange(this.theme.id, NumSegment.TYPE_INT)],
            null,
            [RangeHandler.getInstance().create_single_elt_NumRange(this.logged_user_id, NumSegment.TYPE_INT)],
        );
    }
}