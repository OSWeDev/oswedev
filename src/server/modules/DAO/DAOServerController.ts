import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ForkedTasksController from '../Fork/ForkedTasksController';
import DAOPostCreateTriggerHook from './triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from './triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from './triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from './triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from './triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from './triggers/DAOPreUpdateTriggerHook';

export default class DAOServerController {

    public static TASK_NAME_add_segmented_known_databases: string = ModuleDAO.getInstance().name + ".add_segmented_known_databases";

    public static getInstance() {
        if (!DAOServerController.instance) {
            DAOServerController.instance = new DAOServerController();
        }
        return DAOServerController.instance;
    }

    private static instance: DAOServerController = null;

    /**
     * Global application cache - Brocasted CUD - Local R -----
     */
    /**
     * Le nombre est la valeur du segment de la table. L'existence de la table est liée à sa présence dans l'objet simplement.
     */
    public segmented_known_databases: { [database_name: string]: { [table_name: string]: number } } = {};
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    /**
     * Local thread cache -----
     */

    // On expose des hooks pour les modules qui veulent gérer le filtrage des vos suivant l'utilisateur connecté
    public access_hooks: { [api_type_id: string]: { [access_type: string]: Array<IHookFilterVos<IDistantVOBase>> } } = {};

    public pre_update_trigger_hook: DAOPreUpdateTriggerHook;
    public pre_create_trigger_hook: DAOPreCreateTriggerHook;
    public pre_delete_trigger_hook: DAOPreDeleteTriggerHook;

    public post_update_trigger_hook: DAOPostUpdateTriggerHook;
    public post_create_trigger_hook: DAOPostCreateTriggerHook;
    public post_delete_trigger_hook: DAOPostDeleteTriggerHook;
    /**
     * Local thread cache -----
     */

    private constructor() {
        ForkedTasksController.getInstance().register_task(DAOServerController.TASK_NAME_add_segmented_known_databases, this.add_segmented_known_databases.bind(this));
    }

    /**
     * WARN : Except for initialisation, needs to be brocasted
     * @param database_name
     * @param table_name With segmentation (complete table name)
     * @param segmented_value
     */
    public add_segmented_known_databases(database_name: string, table_name: string, segmented_value: number) {
        if (!this.segmented_known_databases) {
            this.segmented_known_databases = {};
        }

        if (!this.segmented_known_databases[database_name]) {
            this.segmented_known_databases[database_name] = {};
        }
        this.segmented_known_databases[database_name][table_name] = segmented_value;
    }

    public get_dao_policy(translatable_name: string, group: AccessPolicyGroupVO, isAccessConfVoType: boolean, accessConfVoType_DEFAULT_BEHAVIOUR: number): AccessPolicyVO {
        let vo_read: AccessPolicyVO = new AccessPolicyVO();
        vo_read.group_id = group.id;
        vo_read.default_behaviour = isAccessConfVoType ? accessConfVoType_DEFAULT_BEHAVIOUR : AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        vo_read.translatable_name = translatable_name;
        return vo_read;
    }

    public get_dao_dependency_default_granted(from: AccessPolicyVO, to: AccessPolicyVO): PolicyDependencyVO {
        if ((!from) || (!to)) {
            return null;
        }

        let dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
        dependency.src_pol_id = from.id;
        dependency.depends_on_pol_id = to.id;
        return dependency;
    }

    public get_inherited_right(DAO_ACCESS_TYPE: string, inherit_rights_from_vo_type: string): AccessPolicyVO {
        return AccessPolicyServerController.getInstance().get_registered_policy(ModuleDAO.getInstance().getAccessPolicyName(DAO_ACCESS_TYPE, inherit_rights_from_vo_type));
    }

    public get_dao_dependency_default_denied(from: AccessPolicyVO, to: AccessPolicyVO): PolicyDependencyVO {
        if ((!from) || (!to)) {
            return null;
        }

        let dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = from.id;
        dependency.depends_on_pol_id = to.id;

        return dependency;
    }
}