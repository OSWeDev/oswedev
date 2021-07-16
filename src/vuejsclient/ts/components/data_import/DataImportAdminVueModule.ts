import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ComponentDatatableField from '../../../../shared/modules/DAO/vos/datatable/ComponentDatatableField';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';
import ReimportComponent from './reimport_component/reimport_component';
import './scss/data_import.scss';

export default class DataImportAdminVueModule extends VueModuleBase {

    public static IMPORT_MODAL: string = 'modal';
    public static IMPORT_PARAMS: string = 'params';

    public static getInstance(): DataImportAdminVueModule {
        if (!DataImportAdminVueModule.instance) {
            DataImportAdminVueModule.instance = new DataImportAdminVueModule();
        }

        return DataImportAdminVueModule.instance;
    }

    private static instance: DataImportAdminVueModule = null;

    public menuBranch: MenuElementVO = null;

    private constructor() {

        super(ModuleDataImport.getInstance().name);
    }

    public async initializeAsync() {

        let has_full_menu_access: boolean = await ModuleAccessPolicy.getInstance().checkAccess(ModuleDataImport.POLICY_BO_FULL_MENU_ACCESS);

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleDataImport.POLICY_LOGS_ACCESS)) {
            return;
        }

        this.menuBranch =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleDataImport.POLICY_LOGS_ACCESS,
                    VueAppController.getInstance().app_name,
                    "DataImportAdminVueModule",
                    "fa-upload",
                    20,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            DataImportLogVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleDataImport.POLICY_BO_FULL_MENU_ACCESS,
                VueAppController.getInstance().app_name,
                "DataImportLogVO",
                "fa-info-circle",
                20,
                null,
                null,
                this.menuBranch.id
            ),
            this.routes);

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleDataImport.POLICY_BO_ACCESS)) {
            return;
        }

        await CRUDComponentManager.getInstance().registerCRUD(
            DataImportHistoricVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleDataImport.POLICY_BO_FULL_MENU_ACCESS,
                VueAppController.getInstance().app_name,
                "DataImportHistoricVO",
                "fa-history",
                20,
                null,
                null,
                this.menuBranch.id
            ),
            this.routes);

        // On adapte le CRUD des imports pour avoir un bouton de réimport et une colonne de visualisation graphique de l'état
        let historic_crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[DataImportHistoricVO.API_TYPE_ID];

        historic_crud.readDatatable.unshiftField(new ComponentDatatableField('reimporter', ReimportComponent, 'file_id'));


        await CRUDComponentManager.getInstance().registerCRUD(
            DataImportFormatVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleDataImport.POLICY_BO_FULL_MENU_ACCESS,
                VueAppController.getInstance().app_name,
                "DataImportFormatVO",
                "fa-cogs",
                40,
                null,
                null,
                this.menuBranch.id
            ),
            this.routes);
        await CRUDComponentManager.getInstance().registerCRUD(
            DataImportColumnVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleDataImport.POLICY_BO_FULL_MENU_ACCESS,
                VueAppController.getInstance().app_name,
                "DataImportColumnVO",
                "fa-cogs",
                50,
                null,
                null,
                this.menuBranch.id
            ),
            this.routes);

        // Sur le menu global des imports on propose :
        //  - TODO FIXME : [la ou les pages d'importation qui regroupent plusieurs fichiers à importer]
        //  - l'historique des imports
        //  - les logs détaillés
        //  - les formats d'import
        //  - les colonnes des formats
        // TODO FIXME : On a un sous-menu "groupes" avec les groupes de api_type_ids qui utilisent un fichier commun :
        //  - TODO FIXME : la page qui permet de faire les imports en une fois
        // On va créer une branche pour chaque api_type_id importable, et proposer :
        //  - TODO FIXME : la page d'importation dédiée
        //  - l'historique des imports => lien vers le crud global de ce type mais pré-filtré
        //  - les logs détaillés => lien vers le crud global de ce type mais pré-filtré
        //  - la table intermédiaire d'importation
        //  - les formats d'import => liens vers le crud global pré-filtré
        for (let i in VOsTypesManager.getInstance().moduleTables_by_voType) {
            let moduleTable = VOsTypesManager.getInstance().moduleTables_by_voType[i];

            if (!moduleTable.importable) {
                continue;
            }

            let importmenuBranch: MenuElementVO =
                await MenuController.getInstance().declare_menu_element(
                    MenuElementVO.create_new(
                        ModuleDataImport.POLICY_BO_FULL_MENU_ACCESS,
                        VueAppController.getInstance().app_name,
                        "__i__" + moduleTable.vo_type,
                        "fa-upload",
                        30,
                        null,
                        null,
                        this.menuBranch.id
                    )
                );

            let raw_api_type_id: string = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(moduleTable.vo_type);

            await CRUDComponentManager.getInstance().registerCRUD(
                raw_api_type_id,
                null,
                MenuElementVO.create_new(
                    ModuleDataImport.POLICY_BO_FULL_MENU_ACCESS,
                    VueAppController.getInstance().app_name,
                    raw_api_type_id,
                    "fa-table",
                    30,
                    null,
                    null,
                    importmenuBranch.id
                ),
                this.routes);
        }
    }

    // protected getDataImportHistoricVOCRUD(): CRUD<DataImportHistoricVO> {
    //     let crud: CRUD<DataImportHistoricVO> = new CRUD<DataImportHistoricVO>(new Datatable<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID));

    //     crud.readDatatable.pushField(new SimpleDatatableField("api_type_id"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("segment_date_index"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("state"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("import_type"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("params"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("start_date"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("last_up_date"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("end_date"));

    //     crud.readDatatable.pushField(new ManyToOneReferenceDatatableField(
    //         "file_id",
    //         VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID],
    //         [
    //             new SimpleDatatableField("path")
    //         ]));

    //     crud.readDatatable.pushField(new ManyToOneReferenceDatatableField(
    //         "user_id",
    //         VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID],
    //         [
    //             new SimpleDatatableField("name")
    //         ]));

    //     return crud;
    // }

    // protected getDataImportLogVOCRUD(): CRUD<DataImportLogVO> {
    //     let crud: CRUD<DataImportLogVO> = new CRUD<DataImportLogVO>(new Datatable<DataImportLogVO>(DataImportLogVO.API_TYPE_ID));


    //     public: number;
    //     public: number;

    //     public: string;
    //     public: number;

    //     // Uses code_text if defined or message if not
    //     public: string;
    //     public: string;

    //     crud.readDatatable.pushField(new SimpleDatatableField("api_type_id"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("date"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("log_level"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("code_text"));
    //     crud.readDatatable.pushField(new SimpleDatatableField("message"));

    //     crud.readDatatable.pushField(new ManyToOneReferenceDatatableField(
    //         "data_import_format_id",
    //         VOsTypesManager.getInstance().moduleTables_by_voType[DataImportFormatVO.API_TYPE_ID],
    //         [
    //             new SimpleDatatableField("import_uid")
    //         ]));

    //     crud.readDatatable.pushField(new ManyToOneReferenceDatatableField(
    //         "data_import_historic_id",
    //         VOsTypesManager.getInstance().moduleTables_by_voType[DataImportHistoricVO.API_TYPE_ID],
    //         [
    //             new SimpleDatatableField("name")
    //         ]));

    //     return crud;
    // }
}