import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DashboardGraphVORefVO from './vos/DashboardGraphVORefVO';
import DashboardPageVO from './vos/DashboardPageVO';
import DashboardPageWidgetVO from './vos/DashboardPageWidgetVO';
import DashboardVO from './vos/DashboardVO';
import DashboardWidgetVO from './vos/DashboardWidgetVO';
import VOFieldRefVO from './vos/VOFieldRefVO';

export default class ModuleDashboardBuilder extends Module {

    public static MODULE_NAME: string = "DashboardBuilder";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME + ".BO_ACCESS";

    public static getInstance(): ModuleDashboardBuilder {
        if (!ModuleDashboardBuilder.instance) {
            ModuleDashboardBuilder.instance = new ModuleDashboardBuilder();
        }
        return ModuleDashboardBuilder.instance;
    }

    private static instance: ModuleDashboardBuilder = null;

    private constructor() {

        super("dashboardbuilder", ModuleDashboardBuilder.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let db_table = this.init_DashboardVO();
        let db_page = this.init_DashboardPageVO(db_table);
        this.init_DashboardGraphVORefVO(db_table);
        let db_widget = this.init_DashboardWidgetVO();
        this.init_DashboardPageWidgetVO(db_page, db_widget);
        this.init_VOFieldRefVO();
    }

    private init_DashboardVO(): ModuleTable<any> {

        let datatable_fields = [
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('api_type_ids', ModuleTableField.FIELD_TYPE_string_array, 'Types', false)
        ];

        let res = new ModuleTable(this, DashboardVO.API_TYPE_ID, () => new DashboardVO(), datatable_fields, null, "Dashboards");
        this.datatables.push(res);
        return res;
    }


    private init_DashboardGraphVORefVO(db_table: ModuleTable<any>): ModuleTable<any> {

        let dashboard_id = new ModuleTableField('dashboard_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Dashboard', true);

        let datatable_fields = [
            dashboard_id,
            new ModuleTableField('x', ModuleTableField.FIELD_TYPE_int, 'x', true),
            new ModuleTableField('y', ModuleTableField.FIELD_TYPE_int, 'y', true),
            new ModuleTableField('width', ModuleTableField.FIELD_TYPE_int, 'largeur', true),
            new ModuleTableField('height', ModuleTableField.FIELD_TYPE_int, 'hauteur', true),
            new ModuleTableField('vo_type', ModuleTableField.FIELD_TYPE_string, 'VOType', true)
        ];

        let res = new ModuleTable(this, DashboardGraphVORefVO.API_TYPE_ID, () => new DashboardGraphVORefVO(), datatable_fields, null, "Cellule du graph de vos de Dashboard");
        this.datatables.push(res);
        dashboard_id.addManyToOneRelation(db_table);
        return res;
    }

    private init_DashboardPageVO(db_table: ModuleTable<any>): ModuleTable<any> {

        let dashboard_id = new ModuleTableField('dashboard_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Dashboard', true);

        let datatable_fields = [
            dashboard_id,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let res = new ModuleTable(this, DashboardPageVO.API_TYPE_ID, () => new DashboardPageVO(), datatable_fields, null, "Pages de Dashboard");
        this.datatables.push(res);
        dashboard_id.addManyToOneRelation(db_table);
        return res;
    }

    private init_DashboardWidgetVO(): ModuleTable<any> {

        let datatable_fields = [
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('widget_component', ModuleTableField.FIELD_TYPE_string, 'Composant - Widget', true),
            new ModuleTableField('options_component', ModuleTableField.FIELD_TYPE_string, 'Composant - Options', true),
            new ModuleTableField('default_width', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 106),
            new ModuleTableField('default_height', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 30),
            new ModuleTableField('icone_class', ModuleTableField.FIELD_TYPE_string, 'Classe - icône', true).unique(),
            new ModuleTableField('default_background', ModuleTableField.FIELD_TYPE_string, 'default_background', true, true, '#f5f5f5'),
        ];

        let res = new ModuleTable(this, DashboardWidgetVO.API_TYPE_ID, () => new DashboardWidgetVO(), datatable_fields, null, "Widgets de Dashboard");
        this.datatables.push(res);
        return res;
    }

    private init_DashboardPageWidgetVO(db_page: ModuleTable<any>, db_widget: ModuleTable<any>) {

        let widget_id = new ModuleTableField('widget_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Widget', true);
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page Dashboard', true);

        let datatable_fields = [
            widget_id,
            page_id,
            new ModuleTableField('isDraggable', ModuleTableField.FIELD_TYPE_boolean, 'isDraggable', true, true, true),
            new ModuleTableField('isResizable', ModuleTableField.FIELD_TYPE_boolean, 'isResizable', true, true, true),
            new ModuleTableField('static', ModuleTableField.FIELD_TYPE_boolean, 'static', true, true, false),
            new ModuleTableField('minH', ModuleTableField.FIELD_TYPE_int, 'minH', true, true, 1),
            new ModuleTableField('minW', ModuleTableField.FIELD_TYPE_int, 'minW', true, true, 1),
            new ModuleTableField('maxH', ModuleTableField.FIELD_TYPE_int, 'maxH', true, true, 720),
            new ModuleTableField('maxW', ModuleTableField.FIELD_TYPE_int, 'maxW', true, true, 1272),
            new ModuleTableField('x', ModuleTableField.FIELD_TYPE_int, 'x', true, true, 0),
            new ModuleTableField('y', ModuleTableField.FIELD_TYPE_int, 'y', true, true, 0),
            new ModuleTableField('w', ModuleTableField.FIELD_TYPE_int, 'w', true, true, 0),
            new ModuleTableField('h', ModuleTableField.FIELD_TYPE_int, 'h', true, true, 0),
            new ModuleTableField('i', ModuleTableField.FIELD_TYPE_int, 'i', true),
            new ModuleTableField('dragAllowFrom', ModuleTableField.FIELD_TYPE_string, 'dragAllowFrom', false),
            new ModuleTableField('dragIgnoreFrom', ModuleTableField.FIELD_TYPE_string, 'dragIgnoreFrom', false, true, 'a, button'),
            new ModuleTableField('resizeIgnoreFrom', ModuleTableField.FIELD_TYPE_string, 'resizeIgnoreFrom', false, true, 'a, button'),
            new ModuleTableField('preserveAspectRatio', ModuleTableField.FIELD_TYPE_boolean, 'preserveAspectRatio', true, true, false),

            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true),

            new ModuleTableField('json_options', ModuleTableField.FIELD_TYPE_string, 'json_options', false),

            new ModuleTableField('background', ModuleTableField.FIELD_TYPE_string, 'background', true),
        ];

        this.datatables.push(new ModuleTable(this, DashboardPageWidgetVO.API_TYPE_ID, () => new DashboardPageWidgetVO(), datatable_fields, null, "Pages de Dashboard"));
        widget_id.addManyToOneRelation(db_widget);
        page_id.addManyToOneRelation(db_page);
    }

    private init_VOFieldRefVO() {

        let datatable_fields = [
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'VO Type', true),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'ID Champs', true),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        this.datatables.push(new ModuleTable(this, VOFieldRefVO.API_TYPE_ID, () => new VOFieldRefVO(), datatable_fields, null, "Référence de champs"));
    }
}