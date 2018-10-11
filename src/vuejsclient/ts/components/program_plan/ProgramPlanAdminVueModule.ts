import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import ModuleProgramPlan from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';

export default class ProgramPlanAdminVueModule extends VueModuleBase {

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "ProgramPlanAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-calendar",
        []
    );

    public static getInstance(): ProgramPlanAdminVueModule {
        if (!ProgramPlanAdminVueModule.instance) {
            ProgramPlanAdminVueModule.instance = new ProgramPlanAdminVueModule();
        }

        return ProgramPlanAdminVueModule.instance;
    }

    private static instance: ProgramPlanAdminVueModule = null;

    private constructor() {

        super(ModuleProgramPlan.getInstance().name);
    }

    public initialize() {

        if (!ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlan.ACCESS_GROUP_NAME, ModuleProgramPlan.ADMIN_ACCESS_RULE_NAME)) {
            return;
        }

        let menuBranch: MenuBranch = ProgramPlanAdminVueModule.DEFAULT_MENU_BRANCH;

        let contentsComponentsBranch: MenuBranch = new MenuBranch("ProgramPlanAdminVueModule_ContentsComponents", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-newspaper-o", []);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlan.getInstance().program_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlan.getInstance().program_type_id, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-list"),
                menuBranch,
                contentsComponentsBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlan.getInstance().target_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlan.getInstance().target_type_id, MenuElementBase.PRIORITY_HIGH, "fa-bullseye"),
                menuBranch,
                contentsComponentsBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlan.getInstance().manager_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlan.getInstance().manager_type_id, MenuElementBase.PRIORITY_MEDIUM, "fa-sitemap"),
                menuBranch,
                contentsComponentsBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlan.getInstance().facilitator_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlan.getInstance().facilitator_type_id, MenuElementBase.PRIORITY_LOW, "fa-user-circle"),
                menuBranch,
                contentsComponentsBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlan.getInstance().program_facilitator_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlan.getInstance().program_facilitator_type_id, MenuElementBase.PRIORITY_LOW, "fa-user-circle"),
                menuBranch,
                contentsComponentsBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlan.getInstance().program_manager_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlan.getInstance().program_manager_type_id, MenuElementBase.PRIORITY_MEDIUM, "fa-sitemap"),
                menuBranch,
                contentsComponentsBranch),
            this.routes);
    }
}