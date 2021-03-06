import * as moment from 'moment';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import Alert from '../../../../../../shared/modules/Alert/vos/Alert';
import ICRUDComponentField from '../../../../../../shared/modules/DAO/interface/ICRUDComponentField';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import Datatable from '../../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ManyToOneReferenceDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableField';
import ReferenceDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import RefRangesReferenceDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/RefRangesReferenceDatatableField';
import SimpleDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import TableFieldTypeControllerBase from '../../../../../../shared/modules/TableFieldTypes/vos/TableFieldTypeControllerBase';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../../shared/tools/DateHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleAlertAction, ModuleAlertGetter } from '../../../alert/AlertStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import FileComponent from '../../../file/FileComponent';
import HourrangeInputComponent from '../../../hourrangeinput/HourrangeInputComponent';
import ImageComponent from '../../../image/ImageComponent';
import IsoWeekDaysInputComponent from '../../../isoweekdaysinput/IsoWeekDaysInputComponent';
import MultiInputComponent from '../../../multiinput/MultiInputComponent';
import NumRangeInputComponent from '../../../numrangeinput/NumRangeInputComponent';
import TimestampInputComponent from '../../../timestampinput/TimestampInputComponent';
import TSRangeInputComponent from '../../../tsrangeinput/TSRangeInputComponent';
import TSRangesInputComponent from '../../../tsrangesinput/TSRangesInputComponent';
import TSTZInputComponent from '../../../tstzinput/TSTZInputComponent';
import VueComponentBase from '../../../VueComponentBase';
import CRUDComponentManager from '../../CRUDComponentManager';
import './CRUDComponentField.scss';
let debounce = require('lodash/debounce');

@Component({
    template: require('./CRUDComponentField.pug'),
    components: {
        Filecomponent: FileComponent,
        Imagecomponent: ImageComponent,
        Multiinputcomponent: MultiInputComponent,
        Hourrangeinputcomponent: HourrangeInputComponent,
        Tsrangesinputcomponent: TSRangesInputComponent,
        Isoweekdaysinputcomponent: IsoWeekDaysInputComponent,
        Tsrangeinputcomponent: TSRangeInputComponent,
        Timestampinputcomponent: TimestampInputComponent,
        Tstzinputcomponent: TSTZInputComponent,
        Numrangeinputcomponent: NumRangeInputComponent,
    }
})
export default class CRUDComponentField extends VueComponentBase
    implements ICRUDComponentField {

    public static CRUDComp_UID: number = 1;

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    @ModuleDAOAction
    private storeDatasByIds: (params: { API_TYPE_ID: string, vos_by_ids: { [id: number]: IDistantVOBase } }) => void;

    @ModuleAlertGetter
    private get_alerts: { [path: string]: Alert[] };

    @ModuleAlertAction
    private replace_alerts: (params: { alert_path: string, alerts: Alert[] }) => void;

    @ModuleAlertAction
    private register_alert: (alert: Alert) => void;

    @Prop()
    private field: DatatableField<any, any>;

    @Prop()
    private vo: IDistantVOBase;

    @Prop()
    private default_field_data: any;

    // @Prop({ default: null })
    // private field_select_options_enabled: number[];

    @Prop({ default: false })
    private auto_update_field_value: boolean;

    @Prop()
    private datatable: Datatable<IDistantVOBase>;

    @Prop({ default: true })
    private show_insert_or_update_target: boolean;

    @Prop({ default: true })
    private show_title: boolean;

    @Prop({ default: false })
    private inline_input_mode: boolean;
    @Prop({ default: true })
    private inline_input_show_clear: boolean;
    @Prop({ default: true })
    private inline_input_hide_label: boolean;
    @Prop()
    private inline_input_read_value: any;
    @Prop({ default: false })
    private inline_input_mode_semaphore: boolean;

    @Prop({ default: false })
    private is_disabled: boolean;

    @Prop({ default: null })
    private description: string;

    @Prop({ default: null })
    private maxlength: number;

    @Prop({ default: false })
    private force_input_is_editing: boolean;

    @Prop({ default: false })
    private inline_input_mode_input_only: boolean;

    @Prop({ default: false })
    private force_toggle_button: boolean;

    @Prop({ default: false })
    private inverse_label: boolean;

    @Prop({ default: false })
    private for_export: boolean;

    private this_CRUDComp_UID: number = null;

    private select_options: number[] = [];
    private isLoadingOptions: boolean = false;
    private field_value: any = null;
    private field_value_range: { [type_date: string]: string } = {};
    private field_value_refranges_selected_ids: number[] = [];

    private inline_input_is_busy: boolean = false;

    private can_insert_or_update_target: boolean = false;
    private inline_input_is_editing: boolean = false;

    private select_options_enabled: number[] = [];

    private is_readonly: boolean = false;

    private debounced_reload_field_value = debounce(this.reload_field_value, 50);

    public async mounted() {

        this.this_CRUDComp_UID = CRUDComponentField.CRUDComp_UID++;
        this.inline_input_is_editing = this.force_input_is_editing;
        if (this.inline_input_mode && this.force_input_is_editing) {
            let self = this;
            this.$nextTick(() => self.$refs.input_elt['focus']());
        }

        this.select_options_enabled = this.field.select_options_enabled; // (this.field_select_options_enabled && this.field_select_options_enabled.length > 0) ? this.field_select_options_enabled : this.field.select_options_enabled;

        /**
         * On propose un lien au datatable pour certains comportement
         *  On aura accès en l'état qu'au dernier lien fait
         *  si le lien est rompu on le sait pas
         *  a voir à l'usage ce qu'on en fait
         */
        this.field.vue_component = this;

        if (this.inline_input_mode_semaphore) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore_disable_cb[this.this_CRUDComp_UID] = this.cancel_input;
        }

        if (this.inline_input_mode_semaphore && this.inline_input_is_editing) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = true;
        }
    }


    /**
     * TODO FIXME : gérer tous les cas pas juste les simple datatable field
     */
    // get alert_path(): string {
    //     let field = null;

    //     switch (this.field.type) {
    //         // case DatatableField.MANY_TO_ONE_FIELD_TYPE:
    //         //     field = (this.field as ManyToOneReferenceDatatableField<any>).srcField;
    //         //     break;
    //         // case DatatableField.ONE_TO_MANY_FIELD_TYPE:
    //         //     field = (this.field as OneToManyReferenceDatatableField<any>).destField;
    //         //     break;
    //         // case DatatableField.MANY_TO_MANY_FIELD_TYPE:
    //         //     field = (this.field as ManyToManyReferenceDatatableField<any, any>).interModuleTable.getFieldFromId('id');
    //         //     break;
    //         // case DatatableField.REF_RANGES_FIELD_TYPE:
    //         //     field = (this.field as RefRangesReferenceDatatableField<any>).srcField;
    //         //     break;
    //         // case DatatableField.SIMPLE_FIELD_TYPE:
    //         //     field = (this.field as SimpleDatatableField<any, any>).datatable_field_uid;
    //         //     break;
    //         default:
    //             field = (this.field as SimpleDatatableField<any, any>).datatable_field_uid;
    //             break;
    //     }

    public validateSimpleInput(input_value: any) {

        if (this.inline_input_mode) {
            return;
        }

        // TODO FIXME VALIDATE
        this.field_value = input_value;

        if (this.auto_update_field_value) {
            this.vo[this.field.datatable_field_uid] = this.field_value;
        }

        if (this.field.onChange) {
            this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.$emit('onchangevo', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    // TODO FIXME là on appel 5* la fonction au démarrage... il faut debounce ou autre mais c'est pas normal
    // @Watch('field_select_options_enabled')
    @Watch('field', { immediate: true })
    @Watch('vo')
    @Watch('datatable')
    @Watch('default_field_data')
    @Watch('targetModuleTable_count')
    public async on_reload_field_value() {
        this.debounced_reload_field_value();
    }

    @Watch('inline_input_read_value', { immediate: true })
    private onchange_inline_input_read_value() {
        if (!this.inline_input_mode) {
            return;
        }
        this.field_value = this.field.dataToUpdateIHM(this.inline_input_read_value, this.vo);
    }

    private async reload_field_value() {

        this.can_insert_or_update_target = false;

        this.is_readonly = this.field.is_readonly || this.is_disabled;

        if (this.inline_input_mode && this.inline_input_read_value && ((!this.needs_options) || ((!!this.select_options) && this.select_options.length))) {
            // Si inline input mode et inline_input_read_value on esquive cette mise à jour puisque la valeur par défaut du champ est déjà définie à ce stade normalement
            return;
        }

        let field_value: any = (this.vo && this.field) ? this.vo[this.field.datatable_field_uid] : null;

        // JNE : Ajout d'un filtrage auto suivant conf si on est pas sur le CRUD. A voir si on change pas le CRUD plus tard
        if (!this.datatable) {
            field_value = this.field.dataToUpdateIHM(field_value, this.vo);
        }

        this.field_value = field_value;

        // JNE : je sais pas si il faut se placer au dessus ou en dessous de ça ...
        if (this.field_type == ModuleTableField.FIELD_TYPE_daterange && this.field_value) {
            let date: string[] = this.field_value.toString().split('-');

            if (date && date.length > 0) {
                Vue.set(this.field_value_range, this.field.datatable_field_uid + '_start', this.formatDateForField(date[0]));
                Vue.set(this.field_value_range, this.field.datatable_field_uid + '_end', this.formatDateForField(date[1]));
            }
        }

        let self = this;
        if ((this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE)) {
            ModuleAccessPolicy.getInstance().checkAccess(
                ModuleDAO.getInstance().getAccessPolicyName(
                    ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE,
                    (this.field as ReferenceDatatableField<any>).targetModuleTable.vo_type)).then((res: boolean) => {
                        self.can_insert_or_update_target = res;
                    });
        }

        this.isLoadingOptions = true;
        await this.prepare_select_options();


        if (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE) {
            this.field_value_refranges_selected_ids = [];

            if ((!this.select_options) || (RangeHandler.getInstance().getCardinalFromArray(this.field_value) > this.select_options.length)) {
                // Si on a plus d'option dans le range que dans les options du champ, on filtre par les options du champs
                for (let i in this.select_options) {
                    let id = parseInt(this.select_options[i].toString());
                    if (RangeHandler.getInstance().elt_intersects_any_range(id, this.field_value)) {
                        this.field_value_refranges_selected_ids.push(id);
                    }
                }
            } else {

                let options_by_id: { [id: number]: boolean } = ObjectHandler.getInstance().mapFromIdsArray(this.select_options);
                // sinon on commence par le range
                RangeHandler.getInstance().foreach_ranges_sync(this.field_value, (id: number) => {
                    if (options_by_id[id]) {
                        this.field_value_refranges_selected_ids.push(id);
                    }
                });
            }
        }
        this.isLoadingOptions = false;
    }

    private formatDateForField(date: string, separator: string = '/'): string {
        if (!date) {
            return null;
        }

        let dateCut: string[] = date.split(separator);

        return DateHandler.getInstance().formatDayForIndex(moment().utc(true).year(parseInt(dateCut[2])).month(parseInt(dateCut[1]) - 1).date(parseInt(dateCut[0])));
    }

    private getInputValue(input: any): any {

        let input_value: any = null;

        if ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
            ((this.field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html)) {
            input_value = input;
        } else {
            input_value = input.value;
        }

        if ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
            ((this.field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_boolean) &&
            this.field.is_required) {
            input_value = input.checked;
        }

        // cas du checkbox où la value est useless ...

        if (this.field.required) {
            if ((input_value == null) || (typeof input_value == "undefined")) {

                switch (this.field.type) {
                    case DatatableField.SIMPLE_FIELD_TYPE:
                        switch ((this.field as SimpleDatatableField<any, any>).moduleTableField.field_type) {
                            case ModuleTableField.FIELD_TYPE_boolean:
                            case ModuleTableField.FIELD_TYPE_daterange:
                            case ModuleTableField.FIELD_TYPE_hourrange_array:
                            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            case ModuleTableField.FIELD_TYPE_refrange_array:
                            case ModuleTableField.FIELD_TYPE_numrange_array:
                            case ModuleTableField.FIELD_TYPE_isoweekdays:
                            case ModuleTableField.FIELD_TYPE_html:
                                break;

                            default:
                                input.setCustomValidity ? input.setCustomValidity(this.label(ModuleTableField.VALIDATION_CODE_TEXT_required)) : document.getElementById(input.id)['setCustomValidity'](this.label(ModuleTableField.VALIDATION_CODE_TEXT_required));
                                return;
                        }
                        break;

                    default:
                        input.setCustomValidity ? input.setCustomValidity(this.label(ModuleTableField.VALIDATION_CODE_TEXT_required)) : document.getElementById(input.id)['setCustomValidity'](this.label(ModuleTableField.VALIDATION_CODE_TEXT_required));
                        return;
                }
            }
        }

        if (!this.field.validate) {
            return;
        }

        let error: string = this.field.validate(input_value);
        let msg;

        if ((!error) || (error == "")) {
            msg = "";
        } else {
            msg = this.t(error);
        }
        if ((this.field.type != DatatableField.SIMPLE_FIELD_TYPE) || ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
            ((this.field as SimpleDatatableField<any, any>).moduleTableField.field_type != ModuleTableField.FIELD_TYPE_html))) {

            input.setCustomValidity ? input.setCustomValidity(msg) : document.getElementById(input.id)['setCustomValidity'](msg);
        }
        return input_value;
    }

    private validateInput(input: any) {

        if (this.inline_input_mode) {
            return;
        }

        this.field_value = this.getInputValue(input);

        if (this.auto_update_field_value) {
            this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }

        if (this.field.onChange) {
            this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.$emit('onchangevo', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    private validateEndOfInput(input: any) {

        //TODO checker impact sur le crud employee GR notement avec la mise en majuscule nom/prenom et le numéro employée
        // if (!this.inline_input_mode) {
        //     return;
        // }

        this.field_value = this.getInputValue(input);

        if (this.field.onEndOfChange) {
            this.field.onEndOfChange(this.vo);
            this.datatable.refresh();
        }

        this.$emit('onchangevo', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    private validateToggle() {

        this.field_value = !this.field_value;

        if (this.inline_input_mode) {
            return;
        }

        if (!this.field.validate) {
            return;
        }

        let error: string = this.field.validate(this.field_value);
        let msg;

        if ((!error) || (error == "")) {
            msg = "";
        } else {
            msg = this.t(error);
        }

        if (this.auto_update_field_value) {
            this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }

        if (this.field.onChange) {
            this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.$emit('onchangevo', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    private validateMultiInput(values: any[]) {
        if (this.inline_input_mode) {
            return;
        }

        if (this.auto_update_field_value) {
            this.vo[this.field.datatable_field_uid] = values;
        }

        if (this.field.onChange) {
            this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.$emit('onchangevo', this.vo, this.field, values, this);
        this.$emit('validatemultiinput', values, this.field, this.vo);
    }


    private changeValue(vo: IDistantVOBase, field: DatatableField<any, any>, value: any, datatable: Datatable<IDistantVOBase>) {

        if (!this.datatable) {
            vo[field.datatable_field_uid] = this.field.UpdateIHMToData(value, this.vo);
        } else {
            vo[field.datatable_field_uid] = value;
        }

        if (!datatable) {
            return;
        }
        for (let i in datatable.fields) {
            let field_datatable: DatatableField<any, any> = datatable.fields[i];
            if (field_datatable.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {

                let manyToOneField: ManyToOneReferenceDatatableField<any> = (field_datatable as ManyToOneReferenceDatatableField<any>);
                let options: { [id: number]: IDistantVOBase; } = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type];

                if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                    options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(vo, options);
                }

                if (options) {
                    field_datatable.setSelectOptionsEnabled(ObjectHandler.getInstance().arrayFromMap(options).map((elem) => elem.id));
                }
            }

            if (field_datatable.type == DatatableField.REF_RANGES_FIELD_TYPE) {

                let refrangesField: RefRangesReferenceDatatableField<any> = (field_datatable as RefRangesReferenceDatatableField<any>);
                let options = this.getStoredDatas[refrangesField.targetModuleTable.vo_type];

                if (!!refrangesField.filterOptionsForUpdateOrCreateOnRefRanges) {
                    options = refrangesField.filterOptionsForUpdateOrCreateOnRefRanges(vo, options);
                }

                if (options) {
                    field_datatable.setSelectOptionsEnabled(ObjectHandler.getInstance().arrayFromMap(options).map((elem) => elem.id));
                }
            }
        }
    }

    private updateDateRange(input: any) {

        if (this.inline_input_mode) {
            return;
        }

        // On veut stocker au format "day day"
        let start = this.field_value_range[this.field.datatable_field_uid + '_start'];
        let end = this.field_value_range[this.field.datatable_field_uid + '_end'];

        let res = "";
        if (start) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(start).utc(true));
            } catch (error) {
                ConsoleHandler.getInstance().error(error);
            }
        }

        res += "-";

        if (end) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(end).utc(true));
            } catch (error) {
                ConsoleHandler.getInstance().error(error);
            }
        }

        this.inputValue(res);
    }

    /**
     * Cas spécifique du FileVo sur lequel on a un champ fichier qui crée l'objet que l'on souhaite update ou create.
     * Si on est en cours d'update, il faut conserver l'ancien vo (pour maintenir les liaisons vers son id)
     *  et lui mettre en path le nouveau fichier. On garde aussi le nouveau file, pour archive de l'ancien fichier
     * @param fileVo
     */
    private async uploadedFile(fileVo: FileVO) {
        this.$emit('uploadedfile', this.vo, this.field, fileVo);
    }

    //prepare la listes des options
    private async prepare_select_options() {
        if ((this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE)) {

            let manyToOne: ReferenceDatatableField<any> = (this.field as ReferenceDatatableField<any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            /**
             * TODO refondre cette logique de filtrage des options ça parait absolument suboptimal
             */

            let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];

            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
                options = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToOne.targetModuleTable.vo_type));
                this.storeDatasByIds({ API_TYPE_ID: manyToOne.targetModuleTable.vo_type, vos_by_ids: options });
            }

            if (this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {
                let manyToOneField: ManyToOneReferenceDatatableField<any> = (this.field as ManyToOneReferenceDatatableField<any>);
                if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                    options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(this.vo, options);
                }
            }

            if (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE) {
                let refRangesReferenceDatatableField: RefRangesReferenceDatatableField<any> = (this.field as RefRangesReferenceDatatableField<any>);
                if (!!refRangesReferenceDatatableField.filterOptionsForUpdateOrCreateOnRefRanges) {
                    options = refRangesReferenceDatatableField.filterOptionsForUpdateOrCreateOnRefRanges(this.vo, options);
                }
            }

            //array car les maps (key, value) ordonne automatiquement en fonction des clés (problématique pour trier)
            let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

            let newOptions: number[] = [];
            for (let index in ordered_option_array) {
                let option: IDistantVOBase = ordered_option_array[index];

                if (!this.select_options_enabled || this.select_options_enabled.indexOf(option.id) >= 0) {
                    newOptions.push(option.id);
                }
            }

            this.isLoadingOptions = false;
            this.select_options = newOptions;
            return;
        }

        if (this.field.type == DatatableField.SIMPLE_FIELD_TYPE) {
            let simpleField: SimpleDatatableField<any, any> = (this.field as SimpleDatatableField<any, any>);

            if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum) {
                let newOptions: number[] = [];

                for (let j in simpleField.moduleTableField.enum_values) {
                    let id: number = parseInt(j.toString());

                    if ((!this.select_options_enabled) || (this.select_options_enabled.indexOf(id) >= 0)) {
                        newOptions.push(id);
                    }
                }
                this.isLoadingOptions = false;
                this.select_options = newOptions;
            }
        }
    }

    private async asyncLoadOptions(query: string) {
        this.isLoadingOptions = true;

        if ((!this.field) ||
            ((this.field.type != DatatableField.MANY_TO_ONE_FIELD_TYPE) &&
                (this.field.type != DatatableField.ONE_TO_MANY_FIELD_TYPE) &&
                (this.field.type != DatatableField.MANY_TO_MANY_FIELD_TYPE) &&
                (this.field.type != DatatableField.REF_RANGES_FIELD_TYPE))) {
            this.snotify.warning(this.label('crud.multiselect.search.error'));
            this.isLoadingOptions = false;
            return;
        }

        let manyToOne: ReferenceDatatableField<any> = (this.field as ReferenceDatatableField<any>);

        // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....

        let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];
        if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
            options = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToOne.targetModuleTable.vo_type));
            this.storeDatasByIds({ API_TYPE_ID: manyToOne.targetModuleTable.vo_type, vos_by_ids: options });
        }

        //array car les maps (key, value) ordonne automatiquement en fonction des clés (problématique pour trier)
        let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

        let newOptions: number[] = [];

        for (let index in ordered_option_array) {
            let option: IDistantVOBase = ordered_option_array[index];

            if (manyToOne.dataToHumanReadable(option).toLowerCase().indexOf(query.toLowerCase()) >= 0) {

                if ((!this.select_options_enabled) || (this.select_options_enabled.indexOf(option.id) >= 0)) {
                    newOptions.push(option.id);
                }
            }
        }

        this.isLoadingOptions = false;

        this.select_options = newOptions;
    }

    private asyncLoadEnumOptions(query: string) {
        this.isLoadingOptions = true;

        if ((!this.field) ||
            ((this.field.type != DatatableField.SIMPLE_FIELD_TYPE))) {
            this.snotify.warning(this.label('crud.multiselect.search.error'));
            this.isLoadingOptions = false;
            return;
        }

        let simpleField: SimpleDatatableField<any, any> = (this.field as SimpleDatatableField<any, any>);
        let newOptions: number[] = [];

        for (let i in simpleField.moduleTableField.enum_values) {

            if (simpleField.enumIdToHumanReadable(parseInt(i)).toLowerCase().indexOf(query.toLowerCase()) >= 0) {

                if (!this.select_options_enabled || this.select_options_enabled.indexOf(parseInt(i)) >= 0) {
                    newOptions.push(parseInt(i));
                }
            }
        }

        this.isLoadingOptions = false;
        this.select_options = newOptions;
    }

    private async onChangeField() {

        if (this.inline_input_mode) {
            return;
        }

        if (this.field_type == DatatableField.REF_RANGES_FIELD_TYPE) {
            let ranges: NumRange[] = [];
            for (let i in this.field_value_refranges_selected_ids) {
                let id = parseInt(this.field_value_refranges_selected_ids[i].toString());

                ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(id, NumSegment.TYPE_INT));
            }
            ranges = RangeHandler.getInstance().getRangesUnion(ranges);
            this.field_value = ranges;

            let refrangesField: RefRangesReferenceDatatableField<any> = (this.field as RefRangesReferenceDatatableField<any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            let options = this.getStoredDatas[refrangesField.targetModuleTable.vo_type];
            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
                options = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(refrangesField.targetModuleTable.vo_type));
                this.storeDatasByIds({ API_TYPE_ID: refrangesField.targetModuleTable.vo_type, vos_by_ids: options });
            }

            if (!!refrangesField.filterOptionsForUpdateOrCreateOnRefRanges) {
                options = refrangesField.filterOptionsForUpdateOrCreateOnRefRanges(this.vo, options);
            }

            //array car les maps (key, value) ordonne automatiquement en fonction des clés (problématique pour trier)
            let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

            let newOptions: number[] = [];
            for (let index in ordered_option_array) {
                let option: IDistantVOBase = ordered_option_array[index];

                if (!this.select_options_enabled || this.select_options_enabled.indexOf(option.id) >= 0) {
                    newOptions.push(option.id);
                }
            }
            this.select_options = newOptions;
        }

        if (this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {

            let manyToOneField: ManyToOneReferenceDatatableField<any> = (this.field as ManyToOneReferenceDatatableField<any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            let options = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type];
            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
                options = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToOneField.targetModuleTable.vo_type));
                this.storeDatasByIds({ API_TYPE_ID: manyToOneField.targetModuleTable.vo_type, vos_by_ids: options });
            }

            if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(this.vo, options);
            }

            let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

            let newOptions: number[] = [];
            for (let j in ordered_option_array) {
                let option = ordered_option_array[j];

                if (!this.select_options_enabled || this.select_options_enabled.indexOf(option.id) >= 0) {
                    newOptions.push(option.id);
                }
            }
            this.select_options = newOptions;
        }

        // JNE : Ajout d'un filtrage auto suivant conf si on est pas sur le CRUD. A voir si on change pas le CRUD plus tard
        if (!this.datatable) {
            this.field_value = this.field.UpdateIHMToData(this.field_value, this.vo);
        }

        if (this.auto_update_field_value) {
            this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }

        if (this.field.onChange) {
            this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.$emit('onchangevo', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    private inputValue(value: any) {

        if (this.inline_input_mode) {
            return;
        }

        this.field_value = value;

        if (this.auto_update_field_value) {
            this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }

        if (this.field.onChange) {
            this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.$emit('onchangevo', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    /**
     * On est sur un field de type array par définition
     */
    private async select_all() {
        switch (this.field.type) {
            case DatatableField.REF_RANGES_FIELD_TYPE:
                this.field_value_refranges_selected_ids = Array.from(this.select_options);
                break;
            case DatatableField.MANY_TO_MANY_FIELD_TYPE:
            case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                this.field_value = Array.from(this.select_options);
                break;
        }
        await this.onChangeField();
    }

    /**
     * On est sur un field de type array par définition
     */
    private async select_none() {
        switch (this.field.type) {
            case DatatableField.REF_RANGES_FIELD_TYPE:
                this.field_value_refranges_selected_ids = [];
                break;
            case DatatableField.MANY_TO_MANY_FIELD_TYPE:
            case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                this.field_value = [];
                break;
        }
        await this.onChangeField();
    }

    private async inline_clear_value() {
        this.field_value = null;

        await this.change_inline_field_value();
        this.field_value = this.field.dataToUpdateIHM(this.inline_input_read_value, this.vo);
    }

    private async validate_inline_input() {

        let alerts: Alert[] = this.field.validate_input ? this.field.validate_input(this.field_value, this.field, this.vo) : null;
        if (alerts && alerts.length) {

            // Si on a des alertes, d'une part on les register, d'autre part on check qu'on a pas des erreurs sinon il faut refuser l'input
            this.replace_alerts({
                alert_path: this.field.alert_path,
                alerts: alerts
            });

            for (let i in alerts) {
                let alert = alerts[i];

                if (alert.type >= Alert.TYPE_ERROR) {
                    this.snotify.error(this.label('field.validate_input.error'));
                    return;
                }
            }
        }

        await this.change_inline_field_value();
    }

    private async change_inline_field_value() {

        this.inline_input_is_busy = true;

        if (this.auto_update_field_value) {

            // En édition inline + autoupdate, on veut pouvoir aller au plus rapide / simple et donc sauvegarder asap et informer également asap
            let old_value: any = this.vo[this.field.datatable_field_uid];

            this.vo[this.field.datatable_field_uid] = this.field.UpdateIHMToData(this.field_value, this.vo);

            let result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(this.vo);

            if ((!result) || (!result.id)) {
                await this.snotify.error(this.label('field.auto_update_field_value.failed'));
                this.vo[this.field.datatable_field_uid] = old_value;

                this.register_alert(new Alert(this.alert_path, 'field.auto_update_field_value.server_error'));
                this.inline_input_is_busy = false;

                return;
            } else {
                await this.snotify.success(this.label('field.auto_update_field_value.succes'));
            }
        }

        if (this.field.onChange) {
            this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.$emit('onchangevo', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);

        if (this.inline_input_mode_semaphore) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = false;
        }

        if (!this.force_input_is_editing) {
            this.inline_input_is_editing = false;
        }

        this.inline_input_is_busy = false;
    }

    private prepare_inline_input() {

        // Mise en place d'un sémaphore sur l'édition inline : si on est en train d'éditer un champ, on ne peut pas en éditer un second,
        //  sauf à valider un snotify
        if (this.inline_input_mode_semaphore && CRUDComponentManager.getInstance().inline_input_mode_semaphore) {

            let self = this;
            this.$snotify.confirm(this.label('crud.inline_input_mode_semaphore.confirm.body'), self.label('crud.inline_input_mode_semaphore.confirm.title'), {
                timeout: 10000,
                showProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                buttons: [
                    {
                        text: self.t('YES'),
                        action: async (toast) => {
                            self.$snotify.remove(toast.id);
                            for (let idstr in CRUDComponentManager.getInstance().inline_input_mode_semaphore_disable_cb) {
                                let id = parseInt(idstr.toString());
                                let cb = CRUDComponentManager.getInstance().inline_input_mode_semaphore_disable_cb[idstr];

                                if (id == self.this_CRUDComp_UID) {
                                    continue;
                                }
                                cb();
                            }

                            if (!self.field_value) {

                                // JNE : Ajout d'un filtrage auto suivant conf si on est pas sur le CRUD. A voir si on change pas le CRUD plus tard
                                self.field_value = self.field.dataToUpdateIHM(self.inline_input_read_value, self.vo);
                            }

                            if (this.inline_input_mode_semaphore) {
                                CRUDComponentManager.getInstance().inline_input_mode_semaphore = true;
                            }
                            self.inline_input_is_editing = true;
                        },
                        bold: false
                    },
                    {
                        text: self.t('NO'),
                        action: (toast) => {
                            self.$snotify.remove(toast.id);
                        }
                    }
                ]
            });
            return;
        }

        if (!this.field_value) {

            // JNE : Ajout d'un filtrage auto suivant conf si on est pas sur le CRUD. A voir si on change pas le CRUD plus tard
            this.field_value = this.field.dataToUpdateIHM(this.inline_input_read_value, this.vo);
        }
        if (this.inline_input_mode_semaphore) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = true;
        }
        this.inline_input_is_editing = true;
    }

    private cancel_input() {

        this.$emit('on_cancel_input', this.vo, this.field, this);

        if (this.inline_input_mode_semaphore) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = false;
        }

        if (!this.force_input_is_editing) {
            this.inline_input_is_editing = false;
        }
        this.field_value = this.field.dataToUpdateIHM(this.inline_input_read_value, this.vo);
    }

    private async inline_input_submit() {
        if (!this.inline_input_mode) {
            return;
        }

        this.validate_inline_input();
    }

    private async beforeDestroy() {
        delete CRUDComponentManager.getInstance().inline_input_mode_semaphore_disable_cb[this.this_CRUDComp_UID];
        if (this.inline_input_mode_semaphore && this.inline_input_is_editing) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = false;
        }
    }

    private async onkeypress(e) {
        if (!this.inline_input_mode) {
            return;
        }

        let keynum;

        keynum = e.key;

        if (keynum == 'Enter') {

            await this.validate_inline_input();
            return;
        }

        if (keynum == 'Escape') {

            return;
        }
    }

    private async onkeypress_escape() {
        if (!this.inline_input_mode) {
            return;
        }

        await this.cancel_input();
    }

    private on_focus($event) {
        if (this.inline_input_mode && this.force_input_is_editing) {
            $event.target.select();
        }
    }

    get targetModuleTable_count(): number {
        let manyToOne: ReferenceDatatableField<any> = (this.field as ReferenceDatatableField<any>);
        if (manyToOne && manyToOne.targetModuleTable && manyToOne.targetModuleTable.vo_type && this.getStoredDatas && this.getStoredDatas[manyToOne.targetModuleTable.vo_type]) {
            return ObjectHandler.getInstance().arrayFromMap(this.getStoredDatas[manyToOne.targetModuleTable.vo_type]).length;
        }

        return null;
    }

    get field_value_length(): number {
        return this.field_value ? this.field_value.length : 0;
    }

    get is_custom_field_type(): boolean {
        return !!this.custom_field_types[this.field_type];
    }

    get custom_field_types(): { [name: string]: TableFieldTypeControllerBase } {
        return TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers;
    }

    get field_type(): string {
        if (this.field.type == 'Simple') {
            return (this.field as SimpleDatatableField<any, any>).moduleTableField.field_type;
        }

        return this.field.type;
    }

    get random_number(): number {
        return Math.floor(Math.random() * 1000);
    }

    get show_mandatory_star(): boolean {
        return this.field.is_required && (this.field_type != 'boolean');
    }

    get hide_inline_controls(): boolean {
        return this.field.is_required && (this.field_type == 'boolean');
    }

    get needs_options(): boolean {
        let simpleField: SimpleDatatableField<any, any> = (this.field as SimpleDatatableField<any, any>);
        return ((this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE)) ||
            ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) && (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum));
    }

    get hourrange_input_component() {
        return HourrangeInputComponent;
    }

    get alert_path(): string {
        if (!this.field) {
            return null;
        }

        return this.field.alert_path;
    }

    get is_segmented_day_tsrange_array() {
        let field = (this.field as SimpleDatatableField<any, any>).moduleTableField;
        if (!!field) {
            return (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) && (field.segmentation_type == TimeSegment.TYPE_DAY);
        }
    }

    get input_elt_id() {

        if (this.vo && this.vo.id) {
            return this.vo._type + '.' + this.vo.id + '.' + this.field.datatable_field_uid;
        }
        if (this.vo) {
            return this.vo._type + '.' + this.field.datatable_field_uid;
        }
        if (this.field && this.field.moduleTable && this.field.moduleTable.name) {
            return this.field.moduleTable.name + '.' + this.field.datatable_field_uid;
        }

        return this.field.datatable_field_uid;
    }
}