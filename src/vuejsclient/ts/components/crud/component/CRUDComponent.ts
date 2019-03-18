import * as $ from 'jquery';
import * as moment from 'moment';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import DateHandler from '../../../../../shared/tools/DateHandler';
import select2 from '../../../directives/select2/select2';
import { ModuleCRUDAction, ModuleCRUDGetter } from '../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import DatatableComponent from '../../datatable/component/DatatableComponent';
import Datatable from '../../datatable/vos/Datatable';
import DatatableField from '../../datatable/vos/DatatableField';
import ManyToManyReferenceDatatableField from '../../datatable/vos/ManyToManyReferenceDatatableField';
import ReferenceDatatableField from '../../datatable/vos/ReferenceDatatableField';
import SimpleDatatableField from '../../datatable/vos/SimpleDatatableField';
import VueComponentBase from '../../VueComponentBase';
import CRUD from '../vos/CRUD';
import "./CRUDComponent.scss";
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import FileComponent from '../../file/FileComponent';
import ModuleAjaxCache from '../../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import ImageComponent from '../../image/ImageComponent';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import MultiInputComponent from '../../multiinput/MultiInputComponent';
import OneToManyReferenceDatatableField from '../../datatable/vos/OneToManyReferenceDatatableField';

@Component({
    template: require('./CRUDComponent.pug'),
    components: {
        'datatable': DatatableComponent,
        'fileinput': FileComponent,
        'imageinput': ImageComponent,
        'multi-input': MultiInputComponent
    },
    directives: {
        select2: select2
    }
})
export default class CRUDComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    public removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;
    @ModuleCRUDAction
    public setSelectedVOs: (selectedVOs: IDistantVOBase[]) => void;

    @ModuleCRUDGetter
    public getSelectedVOs: IDistantVOBase[];

    @Prop()
    private crud: CRUD<IDistantVOBase>;

    @Prop({ default: false })
    private modal_show_update: boolean;
    @Prop({ default: false })
    private modal_show_create: boolean;
    @Prop({ default: false })
    private modal_show_delete: boolean;

    @Prop()
    private modal_vo_id: number;

    @Prop({ default: null })
    private read_query: any;

    private editableVO: IDistantVOBase = null;
    private newVO: IDistantVOBase = null;

    private select_options: { [field_id: string]: IDistantVOBase[] } = {};
    private isLoadingOptions: { [field_id: string]: boolean } = {};

    private api_types_involved: string[] = [];

    private creating_vo: boolean = false;
    private updating_vo: boolean = false;
    private deleting_vo: boolean = false;

    get isModuleParamTable() {
        return VOsTypesManager.getInstance().moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID] ?
            VOsTypesManager.getInstance().moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID].isModuleParamTable : false;
    }

    public async mounted() {
        if (this.read_query) {
            this.$router.replace({ query: this.read_query });
        }
        await this.reload_datas();
        this.handle_modal_show_hide();
    }

    @Watch("$route")
    private async handle_modal_show_hide() {
        let self = this;
        $("#updateData,#createData,#deleteData").on("hidden.bs.modal", function () {
            self.$router.push(self.getCRUDLink(self.api_type_id));
        });

        if (this.read_query) {
            this.$router.replace({ query: this.read_query });
        }

        if (!this.modal_show_create) {
            $('#createData').modal('hide');
        }
        if (!this.modal_show_update) {
            $('#updateData').modal('hide');
        }
        if (!this.modal_show_delete) {
            $('#deleteData').modal('hide');
        }

        if (this.modal_show_create) {
            $('#createData').modal('show');
            return;
        }
        if (this.modal_show_update) {
            this.setSelectedVOs([this.getStoredDatas[this.crud.updateDatatable.API_TYPE_ID][this.modal_vo_id]]);
            $('#updateData').modal('show');
            return;
        }
        if (this.modal_show_delete) {
            this.setSelectedVOs([this.getStoredDatas[this.crud.updateDatatable.API_TYPE_ID][this.modal_vo_id]]);
            $('#deleteData').modal('show');
            return;
        }
    }

    get api_type_id(): string {
        return this.crud.readDatatable.API_TYPE_ID;
    }

    private async loaddatas() {

        this.isLoading = true;

        this.loadingProgression = 0;
        this.nbLoadingSteps = 5;

        if (!this.crud) {
            this.snotify.error(this.label('crud.errors.loading'));
            return;
        }

        await Promise.all(this.loadDatasFromDatatable(this.crud.readDatatable));
        this.nextLoadingStep();
        await Promise.all(this.loadDatasFromDatatable(this.crud.createDatatable));
        this.nextLoadingStep();
        await Promise.all(this.loadDatasFromDatatable(this.crud.updateDatatable));
        this.nextLoadingStep();

        this.prepareNewVO();
        this.nextLoadingStep();
        this.prepare_select_options();
        this.nextLoadingStep();

        this.isLoading = false;
    }

    // Handle Loading of stored data

    private loadDatasFromDatatable(
        datatable: Datatable<IDistantVOBase>
    ): Array<Promise<any>> {
        let res: Array<Promise<any>> = [];
        let self = this;

        if (self.api_types_involved.indexOf(datatable.API_TYPE_ID) < 0) {
            self.api_types_involved.push(datatable.API_TYPE_ID);

            res.push(
                (async () => {
                    let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<
                        IDistantVOBase
                    >(datatable.API_TYPE_ID);
                    self.storeDatas({
                        API_TYPE_ID: datatable.API_TYPE_ID,
                        vos: vos
                    });
                })()
            );

            for (let i in datatable.fields) {
                let field = datatable.fields[i];

                res = res.concat(this.loadDatasFromDatatableField(field));
            }
        }

        return res;
    }

    private loadDatasFromDatatableField(load_from_datatable_field: DatatableField<any, any>): Array<Promise<any>> {
        let res: Array<Promise<any>> = [];
        let self = this;

        if (load_from_datatable_field.type == DatatableField.SIMPLE_FIELD_TYPE) {
            return res;
        }

        if ((load_from_datatable_field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (load_from_datatable_field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (load_from_datatable_field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE)) {
            let reference: ReferenceDatatableField<any> = load_from_datatable_field as ReferenceDatatableField<any>;
            if (self.api_types_involved.indexOf(reference.targetModuleTable.vo_type) < 0) {
                self.api_types_involved.push(reference.targetModuleTable.vo_type);
                res.push(
                    (async () => {
                        let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(reference.targetModuleTable.vo_type);
                        self.storeDatas({
                            API_TYPE_ID: reference.targetModuleTable.vo_type,
                            vos: vos
                        });
                    })()
                );
            }
            for (let i in reference.sortedTargetFields) {
                res = res.concat(
                    this.loadDatasFromDatatableField(reference.sortedTargetFields[i])
                );
            }
        }

        if (load_from_datatable_field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) {
            let reference: ManyToManyReferenceDatatableField<any, any> = load_from_datatable_field as ManyToManyReferenceDatatableField<any, any>;

            if (self.api_types_involved.indexOf(reference.interModuleTable.vo_type) < 0) {
                self.api_types_involved.push(reference.interModuleTable.vo_type);

                res.push(
                    (async () => {
                        let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(reference.interModuleTable.vo_type);
                        self.storeDatas({
                            API_TYPE_ID: reference.interModuleTable.vo_type,
                            vos: vos
                        });
                    })()
                );
            }
        }

        return res;
    }

    @Watch("crud")
    private async updatedCRUD() {
        await this.reload_datas();
    }

    private prepareNewVO() {

        let obj = {
            _type: this.crud.readDatatable.API_TYPE_ID,
            id: null
        };

        for (let i in this.crud.createDatatable.fields) {
            let field: DatatableField<any, any> = this.crud.createDatatable.fields[i];

            if (field.datatable_field_uid != field.module_table_field_id) {
                continue;
            }

            switch (field.type) {
                case DatatableField.SIMPLE_FIELD_TYPE:
                    obj[field.datatable_field_uid] = (field as SimpleDatatableField<any, any>).moduleTableField.field_default;
                    break;

                default:
                    obj[field.datatable_field_uid] = null;
            }
        }


        // On passe la traduction en IHM sur les champs
        this.newVO = this.dataToIHM(obj, this.crud.createDatatable, false);
    }

    private prepare_select_options() {

        for (let i in this.crud.createDatatable.fields) {
            let field = this.crud.createDatatable.fields[i];

            if (field.datatable_field_uid != field.module_table_field_id) {
                continue;
            }

            if ((field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
                (field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
                (field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE)) {
                let newOptions: number[] = [];

                let manyToOne: ReferenceDatatableField<any> = (field as ReferenceDatatableField<any>);
                let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];

                for (let j in options) {
                    let option = options[j];

                    newOptions.push(option.id);
                }
                this.isLoadingOptions[field.datatable_field_uid] = false;
                Vue.set(this.select_options, field.datatable_field_uid, newOptions);
                continue;
            }

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleField: SimpleDatatableField<any, any> = (field as SimpleDatatableField<any, any>);

                if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum) {
                    let newOptions = [];

                    for (let j in simpleField.moduleTableField.enum_values) {
                        newOptions.push(parseInt(j.toString()));
                    }
                    this.isLoadingOptions[field.datatable_field_uid] = false;
                    Vue.set(this.select_options, field.datatable_field_uid, newOptions);
                    continue;
                }
            }
        }
    }

    private updateBooleanRadio(editableVO: IDistantVOBase, field: DatatableField<any, any>) {
        // On récupère l
        let start = editableVO[field.datatable_field_uid + '_start'];
        let end = editableVO[field.datatable_field_uid + '_end'];

        let res = "";
        if (start) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(start));
            } catch (error) {
            }
        }

        res += "-";

        if (end) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(end));
            } catch (error) {
            }
        }

        editableVO[field.datatable_field_uid] = res;
    }

    private updateDateRange(editableVO: IDistantVOBase, field: DatatableField<any, any>) {
        // On veut stocker au format "day day"
        let start = editableVO[field.datatable_field_uid + '_start'];
        let end = editableVO[field.datatable_field_uid + '_end'];

        let res = "";
        if (start) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(start));
            } catch (error) {
            }
        }

        res += "-";

        if (end) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(end));
            } catch (error) {
            }
        }

        editableVO[field.datatable_field_uid] = res;
    }

    private asyncLoadOptions(query, datatable_field_uid) {
        this.isLoadingOptions[datatable_field_uid] = true;

        let field: DatatableField<any, any>;
        for (let i in this.crud.createDatatable.fields) {
            if (!this.crud.createDatatable.fields[i]) {
                this.snotify.warning(this.label('crud.multiselect.search.error'));
                continue;
            }

            if (this.crud.createDatatable.fields[i].datatable_field_uid == datatable_field_uid) {
                field = this.crud.createDatatable.fields[i];
                break;
            }
        }
        if ((!field) ||
            ((field.type != DatatableField.MANY_TO_ONE_FIELD_TYPE) &&
                (field.type != DatatableField.ONE_TO_MANY_FIELD_TYPE) &&
                (field.type != DatatableField.MANY_TO_MANY_FIELD_TYPE))) {
            this.snotify.warning(this.label('crud.multiselect.search.error'));
            this.isLoadingOptions[datatable_field_uid] = false;
            return;
        }

        let manyToOne: ReferenceDatatableField<any> = (field as ReferenceDatatableField<any>);
        let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];
        let newOptions = [];

        for (let i in options) {
            let option = options[i];

            if (manyToOne.dataToHumanReadable(option).match(new RegExp(query, 'i'))) {
                newOptions.push(option.id);
            }
        }

        this.isLoadingOptions[datatable_field_uid] = false;
        Vue.set(this.select_options, field.datatable_field_uid, newOptions);
    }

    private asyncLoadEnumOptions(query, datatable_field_uid) {
        this.isLoadingOptions[datatable_field_uid] = true;

        let field: DatatableField<any, any>;
        for (let i in this.crud.createDatatable.fields) {
            if (!this.crud.createDatatable.fields[i]) {
                this.snotify.warning(this.label('crud.multiselect.search.error'));
                continue;
            }

            if (this.crud.createDatatable.fields[i].datatable_field_uid == datatable_field_uid) {
                field = this.crud.createDatatable.fields[i];
                break;
            }
        }
        if ((!field) ||
            ((field.type != DatatableField.SIMPLE_FIELD_TYPE))) {
            this.snotify.warning(this.label('crud.multiselect.search.error'));
            this.isLoadingOptions[datatable_field_uid] = false;
            return;
        }

        let simpleField: SimpleDatatableField<any, any> = (field as SimpleDatatableField<any, any>);
        let newOptions = [];

        for (let i in simpleField.moduleTableField.enum_values) {
            newOptions.push(i);
        }

        this.isLoadingOptions[datatable_field_uid] = false;
        Vue.set(this.select_options, field.datatable_field_uid, newOptions);
    }


    get CRUDTitle(): string {
        if (!this.crud) {
            return null;
        }

        return this.label('crud.read.title', {
            datatable_title:
                this.t(VOsTypesManager.getInstance().moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID].label.code_text)
        });
    }

    get selectedVO(): IDistantVOBase {
        if ((!this.getSelectedVOs) || (!this.getSelectedVOs[0])) {
            return null;
        }

        return this.getSelectedVOs[0];
    }

    @Watch("selectedVO")
    private updateSelectedVO() {
        if (!this.selectedVO) {
            this.editableVO = null;
        }

        // On passe la traduction en IHM sur les champs
        this.editableVO = this.dataToIHM(this.getSelectedVOs[0], this.crud.updateDatatable, true);
    }

    private dataToIHM(vo: IDistantVOBase, datatable: Datatable<any>, isUpdate: boolean): IDistantVOBase {

        let res = Object.assign({}, vo);

        for (let i in datatable.fields) {
            let field = datatable.fields[i];

            if (field.datatable_field_uid != field.module_table_field_id) {
                continue;
            }


            if (isUpdate) {

                res[field.datatable_field_uid] = field.dataToUpdateIHM(res[field.datatable_field_uid], res);
            } else {

                res[field.datatable_field_uid] = field.dataToCreateIHM(res[field.datatable_field_uid], res);
            }

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                if ((field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_daterange) {

                    if (res[field.datatable_field_uid]) {

                        let value = res[field.datatable_field_uid];
                        let parts: string[] = value.split('-');

                        if ((!parts) || (parts.length <= 0)) {
                            continue;
                        }

                        if (parts[0] && parts[0].trim() && (parts[0].trim() != "")) {
                            res[field.datatable_field_uid + "_start"] = DateHandler.getInstance().formatDayForIndex(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[0].trim()));
                        }
                        if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                            res[field.datatable_field_uid + "_end"] = DateHandler.getInstance().formatDayForIndex(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[1].trim()));
                        }
                    }
                }
                if ((field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_int_array) {
                    res[field.datatable_field_uid] = !!res[field.datatable_field_uid] ? Array.from(res[field.datatable_field_uid]) : null;
                }
                if ((field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_string_array) {
                    res[field.datatable_field_uid] = !!res[field.datatable_field_uid] ? Array.from(res[field.datatable_field_uid]) : null;
                }
            }
        }

        return res;
    }

    private IHMToData(vo: IDistantVOBase, datatable: Datatable<any>, isUpdate: boolean): IDistantVOBase {

        let res = Object.assign({}, vo);

        for (let i in datatable.fields) {
            let field = datatable.fields[i];

            if (field.datatable_field_uid != field.module_table_field_id) {
                continue;
            }

            if ((field.type == ReferenceDatatableField.MANY_TO_MANY_FIELD_TYPE) || (field.type == ReferenceDatatableField.ONE_TO_MANY_FIELD_TYPE)) {
                continue;
            }

            if (isUpdate) {

                res[field.datatable_field_uid] = field.UpdateIHMToData(res[field.datatable_field_uid], res);
            } else {

                res[field.datatable_field_uid] = field.CreateIHMToData(res[field.datatable_field_uid], res);
            }

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                if ((field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_daterange) {
                    res[field.datatable_field_uid + "_start"] = undefined;
                    res[field.datatable_field_uid + "_end"] = undefined;
                }
            }
        }

        return res;
    }

    private async createVO() {
        this.snotify.info(this.label('crud.create.starting'));
        this.creating_vo = true;

        if ((!this.newVO) || (this.newVO.id) || (this.newVO._type !== this.crud.readDatatable.API_TYPE_ID)) {
            this.snotify.error(this.label('crud.create.errors.newvo_failure'));
            this.creating_vo = false;
            return;
        }

        try {

            // On passe la traduction depuis IHM sur les champs
            let apiokVo = this.IHMToData(this.newVO, this.crud.createDatatable, false);

            let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(apiokVo);
            if ((!res) || (!res.id)) {
                this.snotify.error(this.label('crud.create.errors.create_failure'));
                this.creating_vo = false;
                return;
            }

            let id = res.id ? parseInt(res.id.toString()) : null;

            let createdVO = await ModuleDAO.getInstance().getVoById<any>(this.crud.readDatatable.API_TYPE_ID, id);
            if ((!createdVO) || (createdVO.id !== id) || (createdVO._type !== this.crud.readDatatable.API_TYPE_ID)) {
                this.snotify.error(this.label('crud.create.errors.create_failure'));
                this.creating_vo = false;
                return;
            }

            // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
            await this.updateManyToMany(this.newVO, this.crud.createDatatable, createdVO);
            await this.updateOneToMany(this.newVO, this.crud.createDatatable, createdVO);

            this.storeData(createdVO);
        } catch (error) {
            this.snotify.error(this.label('crud.create.errors.create_failure') + ": " + error);
            this.creating_vo = false;
            return;
        }

        this.snotify.success(this.label('crud.create.success'));
        this.$router.push(this.getCRUDLink(this.api_type_id));
        this.creating_vo = false;
    }


    /**
     * Méthode qui prend tous les champs ManyToMany de la table et met à jour les tables intermédiaires si besoin
     * @param vo
     */
    private async updateOneToMany(datatable_vo: IDistantVOBase, datatable: Datatable<IDistantVOBase>, db_vo: IDistantVOBase) {
        try {

            for (let i in datatable.fields) {

                if (datatable.fields[i].type != ReferenceDatatableField.ONE_TO_MANY_FIELD_TYPE) {
                    continue;
                }

                let field: OneToManyReferenceDatatableField<any> = datatable.fields[i] as OneToManyReferenceDatatableField<any>;
                let actual_links: IDistantVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds(field.targetModuleTable.vo_type, field.destField.field_id, [db_vo.id]);
                let new_links_target_ids: number[] = datatable_vo[field.module_table_field_id];

                let need_update_links: IDistantVOBase[] = [];

                for (let j in actual_links) {
                    let actual_link = actual_links[j];

                    if (new_links_target_ids.indexOf(actual_link.id) < 0) {

                        actual_link[field.destField.field_id] = null;
                        need_update_links.push(actual_link);
                        continue;
                    }

                    new_links_target_ids.splice(new_links_target_ids.indexOf(actual_link.id), 1);
                }

                for (let j in new_links_target_ids) {
                    let new_link_target_id = new_links_target_ids[j];

                    if ((!this.getStoredDatas[field.targetModuleTable.vo_type]) || (!this.getStoredDatas[field.targetModuleTable.vo_type][new_link_target_id])) {
                        continue;
                    }
                    this.getStoredDatas[field.targetModuleTable.vo_type][new_link_target_id][field.destField.field_id] = db_vo.id;
                    need_update_links.push(this.getStoredDatas[field.targetModuleTable.vo_type][new_link_target_id]);
                }

                if (need_update_links.length > 0) {

                    await ModuleDAO.getInstance().insertOrUpdateVOs(need_update_links);
                    for (let linki in need_update_links) {

                        this.updateData(need_update_links[linki]);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }


    /**
     * Méthode qui prend tous les champs ManyToMany de la table et met à jour les tables intermédiaires si besoin
     * @param vo
     */
    private async updateManyToMany(datatable_vo: IDistantVOBase, datatable: Datatable<IDistantVOBase>, db_vo: IDistantVOBase) {
        try {

            for (let i in datatable.fields) {

                if (datatable.fields[i].type != ReferenceDatatableField.MANY_TO_MANY_FIELD_TYPE) {
                    continue;
                }

                let field: ManyToManyReferenceDatatableField<any, any> = datatable.fields[i] as ManyToManyReferenceDatatableField<any, any>;
                let interSrcRefField = field.interModuleTable.getRefFieldFromTargetVoType(db_vo._type);
                let actual_links: IDistantVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds(field.interModuleTable.vo_type, interSrcRefField.field_id, [db_vo.id]);
                let interDestRefField = field.interModuleTable.getRefFieldFromTargetVoType(field.targetModuleTable.vo_type);
                let new_links_target_ids: number[] = datatable_vo[field.module_table_field_id];

                let need_add_links: IDistantVOBase[] = [];
                let need_delete_links: IDistantVOBase[] = [];

                let sample_vo: IDistantVOBase = {
                    id: undefined,
                    _type: field.interModuleTable.vo_type,
                    [interSrcRefField.field_id]: db_vo.id
                };

                for (let j in actual_links) {
                    let actual_link = actual_links[j];

                    if (new_links_target_ids.indexOf(actual_link[interDestRefField.field_id]) < 0) {

                        need_delete_links.push(actual_link);
                        continue;
                    }

                    new_links_target_ids.splice(new_links_target_ids.indexOf(actual_link[interDestRefField.field_id]), 1);
                }

                for (let j in new_links_target_ids) {
                    let new_link_target_id = new_links_target_ids[j];

                    let link_vo: IDistantVOBase = Object.assign({}, sample_vo);

                    link_vo[interDestRefField.field_id] = new_link_target_id;

                    need_add_links.push(link_vo);
                }

                if (need_add_links.length > 0) {
                    for (let linki in need_add_links) {

                        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(need_add_links[linki]);
                        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                            this.snotify.error(this.label('crud.create.errors.many_to_many_failure'));
                            continue;
                        }
                        need_add_links[linki].id = parseInt(insertOrDeleteQueryResult.id.toString());
                        this.storeData(need_add_links[linki]);
                    }
                }
                if (need_delete_links.length > 0) {
                    await ModuleDAO.getInstance().deleteVOs(need_delete_links);
                    for (let linki in need_delete_links) {
                        this.removeData({
                            API_TYPE_ID: field.interModuleTable.vo_type,
                            id: need_delete_links[linki].id
                        });
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }


    private async updateVO() {
        this.snotify.info(this.label('crud.update.starting'));
        this.updating_vo = true;

        if ((!this.selectedVO) || (!this.editableVO) || (this.editableVO.id !== this.selectedVO.id) || (this.editableVO._type !== this.selectedVO._type)) {
            this.snotify.error(this.label('crud.update.errors.selection_failure'));
            this.updating_vo = false;
            return;
        }

        try {

            // On passe la traduction depuis IHM sur les champs
            let apiokVo = this.IHMToData(this.editableVO, this.crud.updateDatatable, true);

            // On utilise le trigger si il est présent sur le crud
            if (this.crud.preUpdate) {
                let errorMsg = await this.crud.preUpdate(apiokVo, this.editableVO);
                if (errorMsg) {
                    this.snotify.error(this.label(errorMsg));
                    this.updating_vo = false;
                    return;
                }
            }

            let res = await ModuleDAO.getInstance().insertOrUpdateVO(apiokVo);
            let id = res.id ? parseInt(res.id.toString()) : null;

            if ((!res) || (!id) || (id != this.selectedVO.id)) {
                this.snotify.error(this.label('crud.update.errors.update_failure'));
                this.updating_vo = false;
                return;
            }

            let updatedVO = await ModuleDAO.getInstance().getVoById<any>(this.selectedVO._type, this.selectedVO.id);
            if ((!updatedVO) || (updatedVO.id !== this.selectedVO.id) || (updatedVO._type !== this.selectedVO._type)) {
                this.snotify.error(this.label('crud.update.errors.update_failure'));
                this.updating_vo = false;
                return;
            }

            // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
            await this.updateManyToMany(this.editableVO, this.crud.createDatatable, updatedVO);
            await this.updateOneToMany(this.editableVO, this.crud.createDatatable, updatedVO);

            this.updateData(updatedVO);
        } catch (error) {
            this.snotify.error(this.label('crud.update.errors.update_failure') + ": " + error);
            this.updating_vo = false;
            return;
        }

        this.snotify.success(this.label('crud.update.success'));
        this.$router.push(this.getCRUDLink(this.api_type_id));
        this.updating_vo = false;
    }

    private async deleteVO() {
        this.snotify.info(this.label('crud.delete.starting'));
        this.deleting_vo = true;

        if (!this.selectedVO) {
            this.snotify.error(this.label('crud.delete.errors.selection_failure'));
            this.deleting_vo = false;
            return;
        }

        try {

            await ModuleDAO.getInstance().deleteVOs([this.selectedVO]);

            let deletedVO = await ModuleDAO.getInstance().getVoById<any>(this.selectedVO._type, this.selectedVO.id);
            if (deletedVO && deletedVO.id) {
                this.snotify.error(this.label('crud.delete.errors.delete_failure'));
                this.deleting_vo = false;
                return;
            }

            this.removeData({
                API_TYPE_ID: this.selectedVO._type,
                id: this.selectedVO.id
            });
        } catch (error) {
            this.snotify.error(this.label('crud.delete.errors.delete_failure') + ": " + error);
            this.deleting_vo = false;
            return;
        }

        this.snotify.success(this.label('crud.delete.success'));
        this.$router.push(this.getCRUDLink(this.api_type_id));
        this.deleting_vo = false;
    }

    private validateInput(input, field: DatatableField<any, any>) {
        // - @input="(value, id) => validateInput({value:value, id:id}, field)",

        if (field.required) {
            if ((input.value == null) || (typeof input.value == "undefined")) {

                switch (field.type) {
                    case DatatableField.SIMPLE_FIELD_TYPE:
                        switch ((field as SimpleDatatableField<any, any>).moduleTableField.field_type) {
                            case ModuleTableField.FIELD_TYPE_boolean:
                            case ModuleTableField.FIELD_TYPE_daterange:
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

        if (!field.validate) {
            return;
        }

        let error: string = field.validate(input.value);
        let msg;

        if ((!error) || (error == "")) {
            msg = "";
        } else {
            msg = this.t(error);
        }
        input.setCustomValidity ? input.setCustomValidity(msg) : document.getElementById(input.id)['setCustomValidity'](msg);
    }

    private validateMultiInput(values: any[], field: DatatableField<any, any>, vo: string) {
        this[vo][field.datatable_field_uid] = values;
    }

    private onChangeField(vo: IDistantVOBase, field: DatatableField<any, any>) {
        if (!field.onChange) {
            return;
        }
        field.onChange(vo);
    }

    /**
     * Cas spécifique du FileVo sur lequel on a un champ fichier qui crée l'objet que l'on souhaite update ou create.
     * Si on est en cours d'update, il faut conserver l'ancien vo (pour maintenir les liaisons vers son id)
     *  et lui mettre en path le nouveau fichier. On garde aussi le nouveau file, pour archive de l'ancien fichier
     * @param vo
     * @param field
     * @param fileVo
     */
    private async uploadedFile(vo: IDistantVOBase, field: DatatableField<any, any>, fileVo: FileVO) {
        if ((!fileVo) || (!fileVo.id)) {
            return;
        }
        if (this.api_type_id != FileVO.API_TYPE_ID) {
            return;
        }


        if (vo && vo.id) {
            let tmp = this.editableVO[field.datatable_field_uid];
            this.editableVO[field.datatable_field_uid] = fileVo[field.datatable_field_uid];
            fileVo[field.datatable_field_uid] = tmp;

            await ModuleDAO.getInstance().insertOrUpdateVOs([this.editableVO, fileVo]);
            this.updateData(this.editableVO);
            this.updateData(fileVo);
        }

        // On ferme la modal, devenue inutile
        this.$router.push(this.getCRUDLink(this.api_type_id));
    }

    private async reload_datas() {
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved(this.api_types_involved);
        this.api_types_involved = [];
        await this.loaddatas();
    }
}