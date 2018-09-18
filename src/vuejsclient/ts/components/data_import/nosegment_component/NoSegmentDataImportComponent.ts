import * as $ from 'jquery';
import * as moment from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAjaxCache from '../../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import IImportedData from '../../../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportFormatVO from '../../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../../shared/modules/DataImport/vos/DataImportLogVO';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import VueAppController from '../../../../VueAppController';
import FileComponent from '../../file/FileComponent';
import DataImportAdminVueModule from '../DataImportAdminVueModule';
import { ModuleDataImportAction, ModuleDataImportGetter } from '../store/DataImportStore';
import './NoSegmentDataImportComponent.scss';

@Component({
    template: require('./NoSegmentDataImportComponent.pug'),
    components: {
        fileinput: FileComponent
    }
})
export default class NoSegmentDataImportComponent extends VueComponentBase {
    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @ModuleDataImportGetter
    public hasValidOptions: boolean;

    @ModuleDataImportGetter
    public getHistoricOptionsTester: (historic: DataImportHistoricVO, options: any) => boolean;

    @ModuleDataImportGetter
    public getOptions: any;

    @ModuleDataImportGetter
    public getApiTypeIdTester: (api_type_id: string) => boolean;

    @ModuleDataImportAction
    public setOptionsValidator: (options_validator: (options: any) => boolean) => void;

    @Prop()
    public title: string;

    @Prop({ default: null })
    public import_overview_component: VueComponentBase;
    @Prop({ default: null })
    public import_param_component: VueComponentBase;

    @Prop()
    public api_type_ids: string[];

    @Prop()
    public route_path: string;

    @Prop({ default: false })
    public modal_show: boolean;

    private state_ok: string = "ok";
    private state_ko: string = "ko";
    private state_warn: string = "warn";
    private state_unavail: string = "unavail";
    private state_info: string = "info";

    private previous_import_historics: { [api_type_id: string]: DataImportHistoricVO } = {};

    private hasSelectedOptions(historic: DataImportHistoricVO): boolean {
        return this.getHistoricOptionsTester(historic, this.getOptions);
    }

    private check_change_import_historics(): boolean {
        if (!this.import_historics) {
            return !!this.previous_import_historics;
        }

        for (let j in this.import_historics) {
            if (!this.import_historics[j]) {

                if (this.previous_import_historics[j]) {
                    return true;
                }
                continue;
            }

            if (!this.previous_import_historics[j]) {
                return true;
            }

            if (this.previous_import_historics[j].id != this.import_historics[j].id) {
                return true;
            }

            if (this.previous_import_historics[j].state != this.import_historics[j].state) {
                return true;
            }
        }

        return false;
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
            await this.loadRawImportedDatas();
            $('#import_modal').modal('show');
            return;
        }
    }

    get valid_api_type_ids(): string[] {
        let res: string[] = [];

        for (let i in this.api_type_ids) {
            if (this.getApiTypeIdTester(this.api_type_ids[i])) {
                res.push(this.api_type_ids[i]);
            }
        }

        return res;
    }

    get import_state(): string {

        if ((!this.valid_api_type_ids) || (!this.valid_api_type_ids.length)) {
            return this.state_ko;
        }

        // Un segment est ko si tous les valid_api_type_ids sont ko
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
        for (let j in this.api_types_ids_states) {
            if (this.api_types_ids_states[j] != this.state_ok) {
                all_ok = false;
            }
            if (this.api_types_ids_states[j] != this.state_ko) {
                all_ko = false;
            }
            if (this.api_types_ids_states[j] == this.state_info) {
                has_info = true;
            }
        }
        if (all_ko) {
            return this.state_ko;
        }
        if (all_ok && !has_info) {
            return this.state_ok;
        }
        if (has_info) {
            return this.state_info;
        }
        return this.state_warn;
    }


    get api_types_ids_states(): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {}

        if (!this.import_historics) {
            return res;
        }

        for (let j in this.valid_api_type_ids) {
            let api_type_id: string = this.valid_api_type_ids[j];
            let historic: DataImportHistoricVO = this.import_historics[api_type_id];

            if (!historic) {
                res[api_type_id] = this.state_ko;
                continue;
            }

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                    res[api_type_id] = this.state_ok;
                    break;
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                    res[api_type_id] = this.state_ko;
                    break;
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                    res[api_type_id] = this.state_info;
                    break;
                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                default:
                    res[api_type_id] = this.state_warn;
            }
        }

        return res;
    }

    @Watch('import_historics')
    private async loadRawImportedDatasChanged() {
        if (!this.check_change_import_historics()) {
            return;
        }
        this.previous_import_historics = Object.assign({}, this.import_historics);
        await this.loadRawImportedDatas();
    }

    private async loadRawImportedDatas() {
        let promises: Array<Promise<any>> = [];
        let self = this;
        let files_ids: number[] = [];

        if (!this.import_historics) {
            return;
        }

        for (let i in this.import_historics) {

            let historic: DataImportHistoricVO = this.import_historics[i];
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

    get imported_file(): FileVO {

        if ((!this.getStoredDatas) || (!this.getStoredDatas[FileVO.API_TYPE_ID]) || (!this.import_historics)) {
            return null;
        }

        for (let api_type_id in this.import_historics) {
            let historic = this.import_historics[api_type_id];

            if (!historic) {
                continue;
            }

            return this.getStoredDatas[FileVO.API_TYPE_ID][historic.file_id] as FileVO;
        }

        return null;
    }

    get api_types_ids_formats(): { [api_type_id: string]: DataImportFormatVO[] } {
        let res: { [api_type_id: string]: DataImportFormatVO[] } = {};

        if ((!this.getStoredDatas) || (!this.getStoredDatas[DataImportFormatVO.API_TYPE_ID])) {
            return res;
        }

        for (let i in this.getStoredDatas[DataImportFormatVO.API_TYPE_ID]) {
            let format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][i] as DataImportFormatVO;

            if ((!format) || (this.valid_api_type_ids.indexOf(format.api_type_id) < 0)) {
                continue;
            }

            if (!res[format.api_type_id]) {
                res[format.api_type_id] = [];
            }
            res[format.api_type_id].push(format);
        }

        return res;
    }

    get import_historics(): { [api_type_id: string]: DataImportHistoricVO } {
        let res: { [api_type_id: string]: DataImportHistoricVO } = {};

        if ((!this.getStoredDatas) || (!this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID])) {
            return res;
        }

        for (let i in this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID]) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            if (!historic) {
                continue;
            }

            if (!this.hasSelectedOptions(historic)) {
                continue;
            }

            let api_type_id = historic.api_type_id;

            if (res[api_type_id] && moment(res[api_type_id].start_date).isAfter(historic.start_date)) {
                continue;
            }

            res[api_type_id] = historic;
        }

        return res;
    }

    get labels(): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {

            if (!this.import_historics[i]) {
                continue;
            }

            let historic: DataImportHistoricVO = this.import_historics[i];
            let format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][historic.data_import_format_id] as DataImportFormatVO;

            if (!format) {
                res[historic.api_type_id] = this.label('import.api_type_ids.' + historic.api_type_id);
                continue;
            }

            res[historic.api_type_id] = this.label(format.import_uid);
        }

        return res;
    }

    get format_validated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

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
    get has_formatted_datas(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                    res[historic.api_type_id] = true;
                    break;

                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get format_invalidated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

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

    get nb_validated_format_elements(): { [api_type_id: string]: number } {
        let res: { [api_type_id: string]: number } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

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

    get nb_unvalidated_format_elements(): { [api_type_id: string]: number } {
        let res: { [api_type_id: string]: number } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

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

    get needs_format_validation(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

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

    private async continue_importation(api_type_id: string) {
        if ((!this.import_historics) || (!this.import_historics)) {
            return;
        }

        if (this.import_historics[api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[api_type_id].state = ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[api_type_id]);
    }

    private async cancel_importation(api_type_id: string) {
        if ((!this.import_historics) || (!this.import_historics)) {
            return;
        }

        if (this.import_historics[api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[api_type_id].state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[api_type_id]);
    }

    get imported(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

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

    get import_failed(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

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

    get posttreated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

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


    get formatting(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get importing(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get posttreating(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get posttreat_failed(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.import_historics[i];

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
     *  en prenant l'ensemble commun à tous les valid_api_type_ids (si on peut importer un CSV
     *  mais sur un seul api_type_id et pas sur les autres on refuse, le but sur la page
     *  est de gérer un seul fichier pour plusieurs imports)
     */
    get acceptedFiles(): string {
        let res: string[] = null;

        for (let i in this.valid_api_type_ids) {
            let api_type_id: string = this.valid_api_type_ids[i];

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

    get unfinished_imports(): DataImportHistoricVO[] {
        let res: DataImportHistoricVO[] = [];

        for (let i in this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID]) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            if (!historic) {
                continue;
            }

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                    res.push(historic);
                    break;

                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                default:
            }
        }

        return res;
    }

    get dropzoneOptions(): any {

        let self = this;
        return {
            createImageThumbnails: false,
            acceptedFiles: self.acceptedFiles,
            error: (infos, error_message) => {
                self.snotify.error(error_message);
            },
            accept: (file, done) => {

                this.checkUnfinishedImportsAndReplacement(done);
            }
        };
    }

    private async checkUnfinishedImportsAndReplacement(done) {
        let self = this;

        if (self.unfinished_imports && (self.unfinished_imports.length > 0)) {
            self.snotify.confirm(self.label('import.cancel_unfinished_imports.body'), self.label('import.cancel_unfinished_imports.title'), {
                timeout: 10000,
                showProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                buttons: [
                    {
                        text: self.t('YES'),
                        action: async (toast) => {
                            self.$snotify.remove(toast.id);
                            self.snotify.info(self.label('import.cancel_unfinished_imports.cancelling'));

                            let unfinished_imports = self.unfinished_imports;
                            for (let i in unfinished_imports) {
                                unfinished_imports[i].state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
                            }
                            await ModuleDAO.getInstance().insertOrUpdateVOs(unfinished_imports);

                            this.checkReplaceExistingImport(done);
                        },
                        bold: false
                    },
                    {
                        text: self.t('NO'),
                        action: (toast) => {
                            self.$snotify.remove(toast.id);
                            done(self.label('import.new_historic_confirmation.cancelled'));
                        }
                    }
                ]
            });
        } else {

            this.checkReplaceExistingImport(done);
        }
    }

    private async checkReplaceExistingImport(done) {
        let self = this;

        if (self.import_historics) {
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

    private async uploadedFile(fileVo: FileVO) {
        if ((!fileVo) || (!fileVo.id)) {
            return;
        }

        let importHistorics: DataImportHistoricVO[] = [];
        for (let i in this.valid_api_type_ids) {
            let api_type_id: string = this.valid_api_type_ids[i];

            let importHistoric: DataImportHistoricVO = new DataImportHistoricVO();
            importHistoric.api_type_id = api_type_id;
            importHistoric.file_id = fileVo.id;
            importHistoric.import_type = DataImportHistoricVO.IMPORT_TYPE_REPLACE;
            importHistoric.params = this.getOptions;
            importHistoric.segment_date_index = null;
            importHistoric.state = ModuleDataImport.IMPORTATION_STATE_UPLOADED;
            importHistoric.user_id = VueAppController.getInstance().data_user.id;

            importHistorics.push(importHistoric);
        }
        await ModuleDAO.getInstance().insertOrUpdateVOs(importHistorics);

        this.$router.push(this.route_path + '/' + DataImportAdminVueModule.IMPORT_MODAL);

        this.openModal();
    }

    private openModal() {
        this.$router.push(this.route_path + '/' + DataImportAdminVueModule.IMPORT_MODAL);
    }

    get logs_path(): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {};

        if (!this.import_historics) {
            return res;
        }

        if (!this.import_historics) {
            return res;
        }

        for (let j in this.valid_api_type_ids) {
            let api_type_id = this.valid_api_type_ids[j];

            if ((!this.import_historics[api_type_id]) || (!this.import_historics[api_type_id].id)) {
                continue;
            }
            res[api_type_id] = this.getCRUDLink(DataImportLogVO.API_TYPE_ID) + "?FILTER__data_import_historic_id=" + this.import_historics[api_type_id].id;
        }

        return res;
    }

    get raw_datas_path(): { [api_type_id: string]: string } {
        return this.getRaw_datas_path(null);//'import.state.ready_to_import');
    }

    private getRaw_datas_path(import_state: string): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {};

        if (!this.import_historics) {
            return res;
        }

        for (let j in this.valid_api_type_ids) {
            let api_type_id = this.valid_api_type_ids[j];

            if ((!this.import_historics[api_type_id]) || (!this.import_historics[api_type_id].id)) {
                continue;
            }
            res[api_type_id] = this.getCRUDLink(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(api_type_id)) + (import_state ? "?FILTER__importation_state=" + import_state : '');
        }

        return res;
    }

    private async reload_datas() {
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportHistoricVO.API_TYPE_ID]);

        this.storeDatas({
            API_TYPE_ID: DataImportHistoricVO.API_TYPE_ID,
            vos: await ModuleDAO.getInstance().getVos<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID)
        });
    }
}