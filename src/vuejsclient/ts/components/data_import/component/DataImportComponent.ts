import * as $ from 'jquery';
import * as moment from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import IImportedData from '../../../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportFormatVO from '../../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DateHandler from '../../../../../shared/tools/DateHandler';
import TimeSegmentHandler from '../../../../../shared/tools/TimeSegmentHandler';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import FileComponentManager from '../../file/FileComponentManager';
import FileComponent from '../../file/FileComponent';
import VueAppController from '../../../../VueAppController';
import './DataImportComponent.scss';
import DataImportAdminVueModule from '../DataImportAdminVueModule';
import DataImportLogVO from '../../../../../shared/modules/DataImport/vos/DataImportLogVO';
import ModuleAjaxCache from '../../../../../shared/modules/AjaxCache/ModuleAjaxCache';

@Component({
    template: require('./DataImportComponent.pug'),
    components: {
        fileinput: FileComponent
    }
})
export default class DataImportComponent extends VueComponentBase {
    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop()
    public title: string;

    @Prop({ default: null })
    public import_overview_component: VueComponentBase;
    @Prop({ default: null })
    public import_param_component: VueComponentBase;

    @Prop({ default: TimeSegment.TYPE_MONTH })
    public segment_type: string;

    @Prop({ default: 9 })
    public segment_offset: number;

    @Prop({ default: null })
    public initial_lower_segment: TimeSegment;

    @Prop({ default: 12 })
    public segment_number: number;

    @Prop()
    public api_type_ids: string[];

    @Prop()
    public route_path: string;

    @Prop({ default: null })
    public valid_segments: TimeSegment[];

    @Prop({ default: null })
    public initial_selected_segment: string;

    @Prop({ default: false })
    public modal_show: boolean;

    private segment_state_ok: string = "ok";
    private segment_state_ko: string = "ko";
    private segment_state_warn: string = "warn";
    private segment_state_unavail: string = "unavail";
    private segment_state_info: string = "info";

    private segments: TimeSegment[] = [];

    private selected_segment: TimeSegment = null;

    private previous_import_historics: { [segment_date_index: string]: { [api_type_id: string]: DataImportHistoricVO } } = {};

    private check_change_import_historics(): boolean {
        if (!this.import_historics) {
            return !!this.previous_import_historics;
        }

        for (let segment_date_index in this.import_historics) {
            if (!this.import_historics[segment_date_index]) {

                if (this.previous_import_historics[segment_date_index]) {
                    return true;
                }
                continue;
            }

            if (!this.previous_import_historics[segment_date_index]) {
                return true;
            }

            for (let j in this.import_historics[segment_date_index]) {
                if (!this.import_historics[segment_date_index][j]) {

                    if (this.previous_import_historics[segment_date_index][j]) {
                        return true;
                    }
                    continue;
                }

                if (!this.previous_import_historics[segment_date_index][j]) {
                    return true;
                }

                if (this.previous_import_historics[segment_date_index][j].id != this.import_historics[segment_date_index][j].id) {
                    return true;
                }

                if (this.previous_import_historics[segment_date_index][j].state != this.import_historics[segment_date_index][j].state) {
                    return true;
                }
            }
        }

        return false;
    }

    private previous_segments() {
        if ((!this.segments) || (this.segments.length != this.segment_number)) {
            return;
        }

        this.segments = TimeSegmentHandler.getInstance().getPreviousTimeSegments(this.segments, this.segment_type, this.segment_offset);
    }

    private next_segments() {
        if ((!this.segments) || (this.segments.length != this.segment_number)) {
            return;
        }

        this.segments = TimeSegmentHandler.getInstance().getPreviousTimeSegments(this.segments, this.segment_type, -this.segment_offset);
    }

    private async mounted() {
        this.startLoading();
        this.nbLoadingSteps = 2;

        let promises: Array<Promise<any>> = [];
        let self = this;

        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: DataImportFormatVO.API_TYPE_ID,
                vos: await ModuleDAO.getInstance().getVos<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID)
            });
        })());
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: DataImportHistoricVO.API_TYPE_ID,
                vos: await ModuleDAO.getInstance().getVos<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID)
            });
        })());
        await Promise.all(promises);

        this.nextLoadingStep();

        this.init_segments();
        setTimeout(() => {
            this.handle_modal_show_hide();
            $("#import_modal").on("hidden.bs.modal", function () {
                self.$router.push(self.route_path);
            });
        }, 100);

        this.stopLoading();
    }

    @Watch("$route")
    private async handle_modal_show_hide() {
        if (!this.modal_show) {
            $('#import_modal').modal('hide');
        }
        if (this.modal_show) {
            this.selected_segment = null;
            for (let i in this.segments) {
                if (this.segments[i].dateIndex == this.initial_selected_segment) {
                    await this.select_segment(this.segments[i]);
                    break;
                }
            }
            $('#import_modal').modal('show');
            return;
        }
    }

    private async select_segment(segment: TimeSegment) {
        await this.loadRawImportedDatas(segment);
        this.selected_segment = segment;
    }

    get segment_states(): { [date_index: string]: string } {
        let res: { [date_index: string]: string } = {};

        if ((!this.api_type_ids) || (!this.api_type_ids.length)) {
            return res;
        }

        for (let i in this.segments) {
            let segment: TimeSegment = this.segments[i];

            if (!this.is_valid_segments[segment.dateIndex]) {
                res[segment.dateIndex] = this.segment_state_unavail;
                continue;
            }

            // Un segment est ko si tous les api_type_ids sont ko
            //  Un api_type est ko si il n'y a pas d'historique
            //      ou si l'historique est en erreur
            // Un segment est ok si tous les api_types_ids sont ok
            //  Un api_type est ok si il y a un historique et 
            //      que celui-ci est en statut posttreated
            // Un segment est info si un api_type est en info
            //  Un api_type est info si il est est en attente de validation du formattage
            // Un segment est warn dans tous les autres cas
            let all_ok: boolean = true;
            let all_ko: boolean = true;
            let has_info: boolean = false;
            for (let j in this.api_types_ids_states[segment.dateIndex]) {
                if (this.api_types_ids_states[segment.dateIndex][j] != this.segment_state_ok) {
                    all_ok = false;
                }
                if (this.api_types_ids_states[segment.dateIndex][j] != this.segment_state_ko) {
                    all_ko = false;
                }
                if (this.api_types_ids_states[segment.dateIndex][j] == this.segment_state_info) {
                    has_info = true;
                }
            }
            if (all_ko) {
                res[segment.dateIndex] = this.segment_state_ko;
                continue;
            }
            if (all_ok && !has_info) {
                res[segment.dateIndex] = this.segment_state_ok;
                continue;
            }
            if (has_info) {
                res[segment.dateIndex] = this.segment_state_info;
                continue;
            }
            res[segment.dateIndex] = this.segment_state_warn;
        }

        return res;
    }


    get api_types_ids_states(): { [segment_date_index: string]: { [api_type_id: string]: string } } {
        let res: { [segment_date_index: string]: { [api_type_id: string]: string } } = {}

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.segments) {
            let segment: TimeSegment = this.segments[i];
            res[segment.dateIndex] = {};

            if (!this.import_historics[segment.dateIndex]) {
                return res;
            }

            for (let j in this.api_type_ids) {
                let api_type_id: string = this.api_type_ids[j];
                let historic: DataImportHistoricVO = this.import_historics[segment.dateIndex][api_type_id];

                if (!this.is_valid_segments[segment.dateIndex]) {
                    res[segment.dateIndex][api_type_id] = this.segment_state_unavail;
                    continue;
                }

                if (!historic) {
                    res[segment.dateIndex][api_type_id] = this.segment_state_ko;
                    continue;
                }

                switch (historic.state) {
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                        res[segment.dateIndex][api_type_id] = this.segment_state_ok;
                        break;
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                        res[segment.dateIndex][api_type_id] = this.segment_state_ko;
                        break;
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                        res[segment.dateIndex][api_type_id] = this.segment_state_info;
                        break;
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                    case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                    default:
                        res[segment.dateIndex][api_type_id] = this.segment_state_warn;
                }
            }
        }

        return res;
    }

    get is_valid_segments(): { [date_index: string]: boolean } {
        let res: { [date_index: string]: boolean } = {};

        for (let i in this.segments) {
            let segment: TimeSegment = this.segments[i];

            res[segment.dateIndex] = this.valid_segments ? false : true;
            for (let j in this.valid_segments) {
                if (this.valid_segments[j].dateIndex == segment.dateIndex) {
                    res[segment.dateIndex] = true;
                }
            }
        }

        return res;
    }

    private init_segments() {
        this.segments = [];
        let medium_segment_i: number = Math.floor(this.segment_number / 2);

        if (this.segment_number < 1) {
            return;
        }

        let lower_time_segment = this.initial_lower_segment ? this.initial_lower_segment : null;
        if (!lower_time_segment) {
            lower_time_segment = new TimeSegment();
            lower_time_segment.dateIndex = DateHandler.getInstance().formatDayForIndex(moment());
            lower_time_segment.type = this.segment_type;

            lower_time_segment = TimeSegmentHandler.getInstance().getPreviousTimeSegment(lower_time_segment, this.segment_type, medium_segment_i);
        }

        if (lower_time_segment.type != this.segment_type) {
            lower_time_segment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(lower_time_segment.dateIndex), this.segment_type);
        }

        let segment = lower_time_segment;
        for (let i = 0; i < this.segment_number; i++) {
            this.segments.push(segment);
            segment = TimeSegmentHandler.getInstance().getPreviousTimeSegment(segment, this.segment_type, -1);
        }
    }

    @Watch('import_historics')
    private async loadRawImportedDatasSelected_segment(timeSegment: TimeSegment) {
        if (!this.check_change_import_historics()) {
            return;
        }
        this.previous_import_historics = Object.assign({}, this.import_historics);
        await this.loadRawImportedDatas(this.selected_segment);
    }

    private async loadRawImportedDatas(timeSegment: TimeSegment) {
        let promises: Array<Promise<any>> = [];
        let self = this;
        let files_ids: number[] = [];

        if ((!this.import_historics) || (!timeSegment) || (!this.import_historics[timeSegment.dateIndex])) {
            return;
        }

        console.log('loadRawImportedDatas:' + timeSegment.dateIndex);

        for (let i in this.import_historics[timeSegment.dateIndex]) {

            let historic: DataImportHistoricVO = this.import_historics[timeSegment.dateIndex][i];
            let raw_api_type_id = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id);
            ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([raw_api_type_id]);
            promises.push((async () => {
                self.storeDatas({
                    API_TYPE_ID: raw_api_type_id,
                    vos: await ModuleDAO.getInstance().getVos(raw_api_type_id)
                });
            })());

            // On va chercher le fichier aussi du coup
            if ((!historic.file_id) || (this.getStoredDatas[FileVO.API_TYPE_ID] && this.getStoredDatas[FileVO.API_TYPE_ID][historic.file_id]) ||
                (files_ids.indexOf(historic.file_id) >= 0)) {
                continue;
            }
            files_ids.push(historic.file_id);
            promises.push((async () => {
                self.storeData(await ModuleDAO.getInstance().getVoById(FileVO.API_TYPE_ID, historic.file_id));
            })());

        }

        await Promise.all(promises);
    }

    get imported_files(): { [segment_date_index: string]: FileVO } {
        let res: { [segment_date_index: string]: FileVO } = {};

        if ((!this.getStoredDatas) || (!this.getStoredDatas[FileVO.API_TYPE_ID]) || (!this.import_historics)) {
            return res;
        }

        for (let date_index in this.import_historics) {
            res[date_index] = null;

            for (let api_type_id in this.import_historics[date_index]) {
                let historic = this.import_historics[date_index][api_type_id];

                if (!historic) {
                    continue;
                }

                res[date_index] = this.getStoredDatas[FileVO.API_TYPE_ID][historic.file_id] as FileVO;
                break;
            }
        }

        return res;
    }

    get api_types_ids_formats(): { [api_type_id: string]: DataImportFormatVO[] } {
        let res: { [api_type_id: string]: DataImportFormatVO[] } = {};

        if ((!this.getStoredDatas) || (!this.getStoredDatas[DataImportFormatVO.API_TYPE_ID])) {
            return res;
        }

        for (let i in this.getStoredDatas[DataImportFormatVO.API_TYPE_ID]) {
            let format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][i] as DataImportFormatVO;

            if ((!format) || (this.api_type_ids.indexOf(format.api_type_id) < 0)) {
                continue;
            }

            if (!res[format.api_type_id]) {
                res[format.api_type_id] = [];
            }
            res[format.api_type_id].push(format);
        }

        return res;
    }


    get import_historics(): { [segment_date_index: string]: { [api_type_id: string]: DataImportHistoricVO } } {
        let res: { [segment_date_index: string]: { [api_type_id: string]: DataImportHistoricVO } } = {};

        if ((!this.getStoredDatas) || (!this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID])) {
            return res;
        }

        for (let i in this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID]) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            if (!historic) {
                continue;
            }

            let api_type_id = historic.api_type_id;

            for (let j in this.segments) {
                let segment: TimeSegment = this.segments[j];

                if (historic.segment_date_index != segment.dateIndex) {
                    continue;
                }

                if (!res[segment.dateIndex]) {
                    res[segment.dateIndex] = {};
                }

                if (res[segment.dateIndex][api_type_id] && moment(res[segment.dateIndex][api_type_id].start_date).isAfter(historic.start_date)) {
                    continue;
                }

                res[segment.dateIndex][api_type_id] = historic;
            }
        }

        return res;
    }

    get selected_segment_labels(): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {

            if (!this.import_historics[this.selected_segment.dateIndex][i]) {
                continue;
            }

            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];
            let format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][historic.data_import_format_id] as DataImportFormatVO;

            if (!format) {
                res[historic.api_type_id] = this.label('import.api_type_ids.' + historic.api_type_id);
                continue;
            }

            res[historic.api_type_id] = this.label(format.import_uid);
        }

        return res;
    }

    get selected_segment_format_validated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    res[historic.api_type_id] = true;
                    break;

                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }
    get selected_segment_has_formatted_datas(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                    res[historic.api_type_id] = true;
                    break;

                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get selected_segment_format_invalidated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get selected_segment_nb_validated_format_elements(): { [api_type_id: string]: number } {
        let res: { [api_type_id: string]: number } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            res[historic.api_type_id] = 0;

            let raw_imported_datas: { [id: number]: IImportedData } = this.getStoredDatas[ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)] as { [id: number]: IImportedData };
            for (let j in raw_imported_datas) {
                switch (raw_imported_datas[j].importation_state) {
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                    case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                        res[historic.api_type_id]++;
                        break;

                    default:
                }
            }
        }
        return res;
    }

    get selected_segment_nb_unvalidated_format_elements(): { [api_type_id: string]: number } {
        let res: { [api_type_id: string]: number } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            res[historic.api_type_id] = 0;

            let raw_imported_datas: { [id: number]: IImportedData } = this.getStoredDatas[ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)] as { [id: number]: IImportedData };
            for (let j in raw_imported_datas) {
                switch (raw_imported_datas[j].importation_state) {
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                    case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                        res[historic.api_type_id]++;
                        break;
                    default:
                }
            }
        }
        return res;
    }

    get selected_segment_needs_format_validation(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            res[historic.api_type_id] = false;
            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                    res[historic.api_type_id] = true;
                    break;

                default:
            }
        }
        return res;
    }

    private async selected_segment_continue_importation(api_type_id: string) {
        if ((!this.selected_segment) || (!this.import_historics) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return;
        }

        if (this.import_historics[this.selected_segment.dateIndex][api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[this.selected_segment.dateIndex][api_type_id].state = ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[this.selected_segment.dateIndex][api_type_id]);
    }

    private async selected_segment_cancel_importation(api_type_id: string) {
        if ((!this.selected_segment) || (!this.import_historics) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return;
        }

        if (this.import_historics[this.selected_segment.dateIndex][api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[this.selected_segment.dateIndex][api_type_id].state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[this.selected_segment.dateIndex][api_type_id]);
    }

    get selected_segment_imported(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get selected_segment_import_failed(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get selected_segment_posttreated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get selected_segment_posttreat_failed(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    /**
     * On veut la liste des formats de fichiers acceptables pour importation, 
     *  en prenant l'ensemble commun à tous les api_type_ids (si on peut importer un CSV
     *  mais sur un seul api_type_id et pas sur les autres on refuse, le but sur la page
     *  est de gérer un seul fichier pour plusieurs imports)
     */
    get acceptedFiles(): string {
        let res: string[] = null;

        for (let i in this.api_type_ids) {
            let api_type_id: string = this.api_type_ids[i];

            let api_type_id_accepted_files: string[] = [];
            for (let j in this.api_types_ids_formats) {
                let api_type_id_formats: DataImportFormatVO[] = this.api_types_ids_formats[j];

                for (let k in api_type_id_formats) {
                    let api_type_id_format: DataImportFormatVO = api_type_id_formats[k];

                    switch (api_type_id_format.type) {
                        case DataImportFormatVO.TYPE_CSV:
                            if (api_type_id_accepted_files.indexOf('.csv') < 0) {
                                api_type_id_accepted_files.push('.csv');
                            }
                        case DataImportFormatVO.TYPE_XLS:
                        case DataImportFormatVO.TYPE_XLSX:
                            if (api_type_id_accepted_files.indexOf('.xls') < 0) {
                                api_type_id_accepted_files.push('.xls');
                            }
                            if (api_type_id_accepted_files.indexOf('.xlsx') < 0) {
                                api_type_id_accepted_files.push('.xlsx');
                            }
                        default:
                    }
                }
            }

            if (!res) {
                res = api_type_id_accepted_files;
                continue;
            }

            let new_res: string[] = [];
            for (let j in res) {
                let test_res: string = res[j];

                if (api_type_id_accepted_files.indexOf(test_res) >= 0) {
                    new_res.push(test_res);
                }
            }

            res = new_res;
        }

        return res ? res.join(',') : "";
    }

    get dropzoneOptions(): { [segment_date_index: string]: any } {

        let res: { [segment_date_index: string]: any } = {};
        let self = this;

        for (let i in this.segments) {
            let segment = this.segments[i];

            res[segment.dateIndex] = ((segment_date_index: string): any => {
                return {
                    createImageThumbnails: false,
                    acceptedFiles: self.acceptedFiles,
                    error: (infos, error_message) => {
                        self.snotify.error(error_message);
                    },
                    accept: (file, done) => {

                        if (self.import_historics && self.import_historics[segment_date_index]) {
                            self.snotify.confirm(self.label('import.new_historic_confirmation.body'), self.label('import.new_historic_confirmation.title'), {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                                buttons: [
                                    {
                                        text: self.t('YES'),
                                        action: (toast) => {
                                            done();
                                            self.$snotify.remove(toast.id);
                                            self.snotify.info(self.label('import.upload_started'));
                                        },
                                        bold: false
                                    },
                                    {
                                        text: self.t('NO'),
                                        action: (toast) => {
                                            done(self.label('import.new_historic_confirmation.cancelled'));
                                            self.$snotify.remove(toast.id);
                                        }
                                    }
                                ]
                            });
                        } else {
                            done();
                            self.snotify.info(self.label('import.upload_started'));
                        }
                    }
                }
            })(segment.dateIndex);
        }
        return res;
    }

    private async uploadedFile(segment_date_index: string, fileVo: FileVO) {
        if ((!fileVo) || (!fileVo.id)) {
            return;
        }

        let importHistorics: DataImportHistoricVO[] = [];
        for (let i in this.api_type_ids) {
            let api_type_id: string = this.api_type_ids[i];

            let importHistoric: DataImportHistoricVO = new DataImportHistoricVO();
            importHistoric.api_type_id = api_type_id;
            importHistoric.file_id = fileVo.id;
            importHistoric.import_type = DataImportHistoricVO.IMPORT_TYPE_REPLACE;
            importHistoric.params = /*TODO*/null;
            importHistoric.segment_date_index = segment_date_index;
            importHistoric.state = ModuleDataImport.IMPORTATION_STATE_UPLOADED;
            importHistoric.user_id = VueAppController.getInstance().data_user.id;

            importHistorics.push(importHistoric);
        }
        await ModuleDAO.getInstance().insertOrUpdateVOs(importHistorics);

        this.$router.push(this.route_path + '/' + DataImportAdminVueModule.IMPORT_SEGMENT_MODAL + '/' + segment_date_index);
    }

    private openModal(segment: TimeSegment) {
        this.$router.push(this.route_path + '/' + DataImportAdminVueModule.IMPORT_SEGMENT_MODAL + '/' + segment.dateIndex);
    }

    get logs_path(): { [segment_date_index: string]: { [api_type_id: string]: string } } {
        let res: { [segment_date_index: string]: { [api_type_id: string]: string } } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.segments) {
            let segment = this.segments[i];

            res[segment.dateIndex] = {};

            if (!this.import_historics[segment.dateIndex]) {
                continue;
            }

            for (let j in this.api_type_ids) {
                let api_type_id = this.api_type_ids[j];

                if ((!this.import_historics[segment.dateIndex][api_type_id]) || (!this.import_historics[segment.dateIndex][api_type_id].id)) {
                    continue;
                }
                res[segment.dateIndex][api_type_id] = this.getCRUDLink(DataImportLogVO.API_TYPE_ID) + "?FILTER__data_import_historic_id=" + this.import_historics[segment.dateIndex][api_type_id].id;
            }
        }

        return res;
    }

    get raw_datas_path(): { [segment_date_index: string]: { [api_type_id: string]: string } } {
        return this.getRaw_datas_path(null);//'import.state.ready_to_import');
    }

    private getRaw_datas_path(import_state: string): { [segment_date_index: string]: { [api_type_id: string]: string } } {
        let res: { [segment_date_index: string]: { [api_type_id: string]: string } } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.segments) {
            let segment = this.segments[i];

            res[segment.dateIndex] = {};

            if (!this.import_historics[segment.dateIndex]) {
                continue;
            }

            for (let j in this.api_type_ids) {
                let api_type_id = this.api_type_ids[j];

                if ((!this.import_historics[segment.dateIndex][api_type_id]) || (!this.import_historics[segment.dateIndex][api_type_id].id)) {
                    continue;
                }
                res[segment.dateIndex][api_type_id] = this.getCRUDLink(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(api_type_id)) + (import_state ? "?FILTER__importation_state=" + import_state : '');
            }
        }

        return res;
    }
}