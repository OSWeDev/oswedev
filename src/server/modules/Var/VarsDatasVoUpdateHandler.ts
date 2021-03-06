import * as moment from 'moment';
import { Moment } from 'moment';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import StackContext from '../../StackContext';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PerfMonConfController from '../PerfMon/PerfMonConfController';
import PerfMonServerController from '../PerfMon/PerfMonServerController';
import PushDataServerController from '../PushData/PushDataServerController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import VarsDatasProxy from './VarsDatasProxy';
import VarServerControllerBase from './VarServerControllerBase';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

/**
 * On gère le buffer des mises à jour de vos en lien avec des vars pour invalider au plus vite les vars en cache en cas de modification d'un VO
 *  tout en empilant quelques centaines d'updates à la fois, pour ne pas invalider 100 fois les mêmes params, cette étape est coûteuse
 *  on sépare en revanche les vos par type_id et par type de modification (si on modifie 3 fois un vo on veut toutes les modifications pour l'invalidation donc on ignore rien par contre)
 */
export default class VarsDatasVoUpdateHandler {

    public static VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME = 'VarsDatasVoUpdateHandler.ordered_vos_cud';

    public static TASK_NAME_register_vo_cud = 'VarsDatasVoUpdateHandler.register_vo_cud';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller needs to be running in the var calculation bg thread
     */
    public static getInstance(): VarsDatasVoUpdateHandler {
        if (!VarsDatasVoUpdateHandler.instance) {
            VarsDatasVoUpdateHandler.instance = new VarsDatasVoUpdateHandler();
        }
        return VarsDatasVoUpdateHandler.instance;
    }

    private static instance: VarsDatasVoUpdateHandler = null;

    public ordered_vos_cud: Array<DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase> = [];
    public last_call_handled_something: boolean = false;
    private last_registration: Moment = null;

    private throttled_update_param = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_param.bind(this), 100, { leading: false });

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_register_vo_cud, this.register_vo_cud.bind(this));
    }

    /**
     * Objectif on bloque le ModuleDAO en modification, et on informe via notif quand on a à la fois bloqué les updates et vidé le cache de ce module
     */
    public async force_empty_vars_datas_vo_update_cache() {

        ModuleDAOServer.getInstance().global_update_blocker = true;

        while (true) {

            if ((!VarsDatasVoUpdateHandler.getInstance().ordered_vos_cud) ||
                (!VarsDatasVoUpdateHandler.getInstance().ordered_vos_cud.length)) {

                let uid: number = StackContext.getInstance().get('UID');
                let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');
                if (uid) {
                    await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'force_empty_vars_datas_vo_update_cache.done', true);
                }
                ConsoleHandler.getInstance().warn("Cache des modifications de VO vidé. Prêt pour le redémarrage");
                return;
            }
            await ThreadHandler.getInstance().sleep(5000);
        }
    }

    public async register_vo_cud(vo_cud: DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase) {

        if (!ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasVoUpdateHandler.TASK_NAME_register_vo_cud, vo_cud)) {
            return;
        }

        this.ordered_vos_cud.push(vo_cud);
        this.last_registration = moment().utc(true);

        this.throttled_update_param();
    }

    /**
     * On passe en param le nombre max de cud qu'on veut gérer, et on dépile en FIFO
     * @returns true si on a des invalidations trop récentes et qu'on veut donc éviter de calculer des vars
     */
    public async handle_buffer(): Promise<boolean> {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__handle_buffer],
            async () => {

                this.last_call_handled_something = false;
                if ((!this.ordered_vos_cud) || (!this.ordered_vos_cud.length)) {

                    this.set_ordered_vos_cud_from_JSON(await ModuleParams.getInstance().getParamValue(
                        VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME));

                    return false; // je vois pas pourquoi .... this.last_registration && moment().utc(true).add(-500, 'ms').isBefore(this.last_registration);
                }

                this.last_call_handled_something = true;

                // Si on a des modifs en cours, on refuse de dépiler de suite pour éviter de faire des calculs en boucle
                // Sauf si on a trop de demandes déjà en attente dans ce cas on commence à dépiler pour alléger la mémoire
                if ((this.ordered_vos_cud.length < 1000) && this.last_registration && moment().utc(true).add(-500, 'ms').isBefore(this.last_registration)) {
                    return true;
                }

                let limit = this.ordered_vos_cud.length;

                let vo_types: string[] = [];
                let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
                let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};

                let intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};

                let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};

                limit = this.prepare_updates(limit, vos_update_buffer, vos_create_or_delete_buffer, vo_types);

                await this.init_leaf_intersectors(vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);

                await this.invalidate_datas_and_parents(intersectors_by_var_id, ctrls_to_update_1st_stage, vos_create_or_delete_buffer, vos_update_buffer);

                // On met à jour le param en base pour refléter les modifs qui restent en attente de traitement
                this.throttled_update_param();

                // Si on continue d'invalider des Vos on attend sagement avant de relancer les calculs
                return this.last_registration && moment().utc(true).add(-500, 'ms').isBefore(this.last_registration);
            },
            this
        );
    }

    public async invalidate_datas_and_parents(
        intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } },
        ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = null,
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = null,
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = null
    ) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__invalidate_datas_and_parents],
            async () => {

                // Si on veut juste invalider directement des vos, on a pas besoin de fournir le ctrls to update
                if (!ctrls_to_update_1st_stage) {
                    ctrls_to_update_1st_stage = {};
                    for (let var_id_s in intersectors_by_var_id) {
                        ctrls_to_update_1st_stage[var_id_s] = VarsServerController.getInstance().registered_vars_controller_[
                            VarsController.getInstance().var_conf_by_id[var_id_s].name];
                    }
                }

                /**
                 * ALGO en photo... TODO FIXME a remettre au propre
                 */
                let markers: { [var_id: number]: number } = {};
                await this.init_markers(ctrls_to_update_1st_stage, markers);
                await this.compute_intersectors(ctrls_to_update_1st_stage, markers, intersectors_by_var_id, vos_create_or_delete_buffer, vos_update_buffer);

                /**
                 * Une fois qu'on a tous les intercepteurs à appliquer, on charge tous les var_data correspondant de la base
                 *  et on les enfilent dans le buffer de calcul / mise à jour des var_datas
                 */
                await this.find_invalid_datas_and_push_for_update(intersectors_by_var_id);
            },
            this
        );
    }

    private async update_param() {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__update_param],
            async () => {

                await ModuleParams.getInstance().setParamValue(
                    VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME,
                    this.getJSONFrom_ordered_vos_cud());
            },
            this
        );
    }

    /**
     * Recherche en BDD par intersection des var_datas qui correspondent aux intersecteurs, et on push les invalidations dans le buffer de vars
     * @param intersectors_by_var_id
     */
    private async find_invalid_datas_and_push_for_update(intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } }) {
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__find_invalid_datas_and_push_for_update],
            async () => {

                for (let var_id_s in intersectors_by_var_id) {
                    let intersectors = intersectors_by_var_id[var_id_s];

                    if ((!intersectors) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(intersectors))) {
                        continue;
                    }

                    let sample_inter = intersectors[ObjectHandler.getInstance().getFirstAttributeName(intersectors)];

                    let var_datas: VarDataBaseVO[] = await ModuleDAO.getInstance().filterVosByMatroidsIntersections(sample_inter._type, Object.values(intersectors), null);

                    /**
                     * Tout sauf les imports
                     */
                    var_datas = var_datas.filter((vd: VarDataBaseVO) => vd.value_type != VarDataBaseVO.VALUE_TYPE_IMPORT);

                    if (var_datas && var_datas.length) {
                        var_datas.forEach((vd: VarDataBaseVO) => {
                            delete vd.value;
                            vd.value_ts = null;
                        });
                    }

                    /**
                     * On priorise les abonnements actuels
                     */
                    let registered_var_datas: VarDataBaseVO[] = await VarsTabsSubsController.getInstance().filter_by_subs(var_datas);
                    let unregistered_var_datas: VarDataBaseVO[] = VarsController.getInstance().substract_vars_datas(var_datas, registered_var_datas);

                    await VarsDatasProxy.getInstance().prepend_var_datas(registered_var_datas, true);
                    await VarsDatasProxy.getInstance().append_var_datas(unregistered_var_datas);
                }
            },
            this
        );
    }

    private async compute_intersectors(
        ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> },
        markers: { [var_id: number]: number },
        intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } },
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] },
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> }
    ) {

        let start_time = moment().utc(true).unix();
        let real_start_time = start_time;

        let original_markers = Object.assign({}, markers);
        let original_ctrls_to_update_1st_stage = Object.assign({}, ctrls_to_update_1st_stage);

        while (ObjectHandler.getInstance().hasAtLeastOneAttribute(ctrls_to_update_1st_stage)) {

            let actual_time = moment().utc(true).unix();

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.getInstance().warn('VarsDatasVoUpdateHandler:compute_intersectors:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
            }

            let did_something = false;
            let tmp_ctrls_to_update_1st_stage = Object.assign({}, ctrls_to_update_1st_stage);
            for (let i in tmp_ctrls_to_update_1st_stage) {
                let ctrl = ctrls_to_update_1st_stage[i];

                if (markers[ctrl.varConf.id] != 1) {
                    continue;
                }

                did_something = true;
                let Nx = VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, ctrl);

                await this.compute_deps_intersectors_and_union(Nx, intersectors_by_var_id);
                let self = this;

                await DAGController.getInstance().visit_bottom_up_from_node(Nx, async (Ny: VarCtrlDAGNode) => {
                    markers[Ny.var_controller.varConf.id]--;

                    if (!markers[Ny.var_controller.varConf.id]) {
                        await self.compute_deps_intersectors_and_union(Ny, intersectors_by_var_id);
                    }
                });

                delete ctrls_to_update_1st_stage[i];
            }

            /**
             * Force get out of deps loops
             */
            if (!did_something) {
                let blocked = true;


                // On essaie de libérer un des markers 'minimal' pour continuer de remonter depuis ce noeud
                let min_value = null;
                let min_ctrl_id = null;
                for (let i in ctrls_to_update_1st_stage) {
                    let ctrl = ctrls_to_update_1st_stage[i];

                    if ((min_value === null) || ((markers[ctrl.varConf.id] > 0) && (min_value > markers[ctrl.varConf.id]))) {

                        min_value = markers[ctrl.varConf.id];
                        min_ctrl_id = ctrl.varConf.id;
                    }
                }

                if (min_ctrl_id) {

                    markers[min_ctrl_id] = 1;
                    blocked = false;
                }

                // for (let i in ctrls_to_update_1st_stage) {
                //     let ctrl = ctrls_to_update_1st_stage[i];

                //     if (markers[ctrl.varConf.id] > 1) {
                //         blocked = false;
                //         markers[ctrl.varConf.id]--;
                //     }
                // }

                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: Check Vars Deps GRAPH - And build it ...');

                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: vos_create_or_delete_buffer ...');
                for (let vos_create_or_delete_buffer_i in vos_create_or_delete_buffer) {
                    let vos = vos_create_or_delete_buffer[vos_create_or_delete_buffer_i];

                    for (let vo_i in vos) {
                        let vo = vos[vo_i];

                        ConsoleHandler.getInstance().error(
                            JSON.stringify(VOsTypesManager.getInstance().moduleTables_by_voType[vo._type].get_bdd_version(vo)));
                    }
                }
                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: vos_create_or_delete_buffer ---');

                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: vos_update_buffer ...');
                for (let vos_update_buffer_i in vos_update_buffer) {
                    let vos = vos_update_buffer[vos_update_buffer_i];

                    for (let vo_i in vos) {
                        let vo: DAOUpdateVOHolder<IDistantVOBase> = vos[vo_i];

                        ConsoleHandler.getInstance().error(
                            JSON.stringify(VOsTypesManager.getInstance().moduleTables_by_voType[vo.post_update_vo._type].get_bdd_version(vo.post_update_vo)));
                    }
                }
                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: vos_update_buffer ---');

                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: original_ctrls_to_update_1st_stage ...');
                // for (let var_id in original_ctrls_to_update_1st_stage) {
                //     let var_: VarServerControllerBase<VarDataBaseVO> = original_ctrls_to_update_1st_stage[var_id];

                //     ConsoleHandler.getInstance().error(var_id + ':' + var_.varConf.name);
                // }
                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: original_ctrls_to_update_1st_stage ---');

                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: ctrls_to_update_1st_stage ...');
                // for (let var_id in ctrls_to_update_1st_stage) {
                //     let var_: VarServerControllerBase<VarDataBaseVO> = ctrls_to_update_1st_stage[var_id];

                //     ConsoleHandler.getInstance().error(var_id + ':' + var_.varConf.name);
                // }
                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: ctrls_to_update_1st_stage ---');

                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: original_markers ...');
                // for (let var_id in original_markers) {
                //     let e: number = original_markers[var_id];

                //     ConsoleHandler.getInstance().error(var_id + ':' + e);
                // }
                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: original_markers ---');

                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: markers ...');
                // for (let var_id in markers) {
                //     let e: number = markers[var_id];

                //     ConsoleHandler.getInstance().error(var_id + ':' + e);
                // }
                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: markers ---');

                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: intersectors_by_var_id ...');
                for (let var_id in intersectors_by_var_id) {
                    let vos = intersectors_by_var_id[var_id];

                    for (let index in vos) {

                        ConsoleHandler.getInstance().error(var_id + ':' + index);
                    }
                }
                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: intersectors_by_var_id ---');

                if (blocked) {
                    let tmp_ctrls_to_update_1st_stage_ = Object.assign({}, ctrls_to_update_1st_stage);
                    for (let i in tmp_ctrls_to_update_1st_stage_) {
                        delete ctrls_to_update_1st_stage[i];
                    }
                }
            }
        }
    }

    private async compute_deps_intersectors_and_union(
        Nx: VarCtrlDAGNode,
        intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } }
    ) {
        let intersectors = intersectors_by_var_id[Nx.var_controller.varConf.id];
        intersectors = intersectors ? intersectors : {};

        let has_deps_to_compute: boolean = false;

        for (let j in Nx.outgoing_deps) {
            let dep = Nx.outgoing_deps[j];
            let controller = (dep.outgoing_node as VarCtrlDAGNode).var_controller;

            if (!intersectors_by_var_id[controller.varConf.id]) {
                continue;
            }

            has_deps_to_compute = true;
            let tmp = await Nx.var_controller.get_invalid_params_intersectors_from_dep(
                dep.dep_name,
                Object.values(intersectors_by_var_id[controller.varConf.id]));
            if (tmp && tmp.length) {
                tmp.forEach((e) => intersectors[e.index] = e);
            }
        }

        if (!has_deps_to_compute) {
            return;
        }

        intersectors = ObjectHandler.getInstance().mapByStringFieldFromArray(
            MatroidController.getInstance().union(Object.values(intersectors)), 'index');

        if ((!intersectors) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(intersectors))) {
            return;
        }
        intersectors_by_var_id[Nx.var_controller.varConf.id] = intersectors;
    }

    /**
     * L'idée est de noter les noeuds de l'arbre en partant des noeuds de base (ctrls_to_update_1st_stage) et en remontant dans l'arbre en
     *  indiquant un +1 sur chaque noeud. Ce marqueur est utlisé par le suite pour savoir les dépendances en attente ou résolues
     * @param ctrls_to_update_1st_stage
     * @param markers
     */
    private async init_markers(ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> }, markers: { [var_id: number]: number }) {
        for (let i in ctrls_to_update_1st_stage) {
            let ctrl = ctrls_to_update_1st_stage[i];

            await DAGController.getInstance().visit_bottom_up_from_node(
                VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, ctrl),
                async (node: VarCtrlDAGNode) => {
                    let controller = node.var_controller;
                    if (!markers[controller.varConf.id]) {
                        markers[controller.varConf.id] = 0;
                    }
                    markers[controller.varConf.id]++;
                });
        }
    }

    /**
     * Pour chaque vo_type, on prend tous les varcontrollers concernés et on demande les intersecteurs en CD et en U
     *  On combinera les intersecteurs en CD et U via une union quand on aura validé qu'on a pas une autre variable qui pourrait impacter celle-ci
     */
    private async init_leaf_intersectors(
        vo_types: string[],
        intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } },
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> },
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] },
        ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> }) {

        for (let i in vo_types) {
            let vo_type = vo_types[i];

            for (let j in VarsServerController.getInstance().registered_vars_controller_by_api_type_id[vo_type]) {
                let var_controller = VarsServerController.getInstance().registered_vars_controller_by_api_type_id[vo_type][j];

                let intersectors = intersectors_by_var_id[var_controller.varConf.id] ? intersectors_by_var_id[var_controller.varConf.id] : [];

                for (let k in vos_create_or_delete_buffer[vo_type]) {
                    let vo_create_or_delete = vos_create_or_delete_buffer[vo_type][k];

                    let tmp = await var_controller.get_invalid_params_intersectors_on_POST_C_POST_D(vo_create_or_delete);
                    if ((!tmp) || (!tmp.length)) {
                        continue;
                    }
                    tmp.forEach((e) => intersectors[e.index] = e);
                }

                for (let k in vos_update_buffer[vo_type]) {
                    let vo_update_buffer = vos_update_buffer[vo_type][k];

                    let tmp = await var_controller.get_invalid_params_intersectors_on_POST_U(vo_update_buffer);
                    if ((!tmp) || (!tmp.length)) {
                        continue;
                    }
                    tmp.forEach((e) => intersectors[e.index] = e);
                }

                if (intersectors && ObjectHandler.getInstance().hasAtLeastOneAttribute(intersectors)) {
                    intersectors_by_var_id[var_controller.varConf.id] = ObjectHandler.getInstance().mapByStringFieldFromArray(
                        MatroidController.getInstance().union(Object.values(intersectors)), 'index');
                    ctrls_to_update_1st_stage[var_controller.varConf.id] = var_controller;
                }
            }
        }
    }

    /**
     * Préparation du batch d'invalidation des vars suite à des CUD de vos
     * @param limit nombre max de CUDs à prendre en compte dans ce batch
     * @param vos_update_buffer les updates par type à remplir
     * @param vos_create_or_delete_buffer les creates / deletes par type à remplir
     * @param vo_types la liste des vo_types à remplir
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon (et donc le buffer est vide)
     */
    private prepare_updates(limit: number, vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> }, vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] }, vo_types: string[]): number {

        let start_time = moment().utc(true).unix();
        let real_start_time = start_time;

        while ((limit > 0) && this.ordered_vos_cud && this.ordered_vos_cud.length) {


            let actual_time = moment().utc(true).unix();

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.getInstance().warn('VarsDatasVoUpdateHandler:prepare_updates:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
            }

            let vo_cud = this.ordered_vos_cud.shift();

            // Si on a un champ _type, on est sur un VO, sinon c'est un update
            if (!!vo_cud['_type']) {
                if (!vos_create_or_delete_buffer[vo_cud['_type']]) {

                    vo_types.push(vo_cud['_type']);
                    vos_create_or_delete_buffer[vo_cud['_type']] = [];
                }
                vos_create_or_delete_buffer[vo_cud['_type']].push(vo_cud as IDistantVOBase);
            } else {
                let update_holder: DAOUpdateVOHolder<IDistantVOBase> = vo_cud as DAOUpdateVOHolder<IDistantVOBase>;
                if (!vos_update_buffer[update_holder.post_update_vo._type]) {
                    if (!vos_create_or_delete_buffer[update_holder.post_update_vo._type]) {
                        vo_types.push(update_holder.post_update_vo._type);
                    }

                    vos_update_buffer[update_holder.post_update_vo._type] = [];
                }
                vos_update_buffer[update_holder.post_update_vo._type].push(update_holder);
            }

            limit--;
        }

        return limit;
    }

    private getJSONFrom_ordered_vos_cud(): string {
        let res: any[] = [];

        for (let i in this.ordered_vos_cud) {
            let vo_cud = this.ordered_vos_cud[i];

            if (!!vo_cud['_type']) {
                let tmp = APIControllerWrapper.getInstance().try_translate_vo_to_api(vo_cud);
                res.push(tmp);
            } else {
                let tmp = new DAOUpdateVOHolder<IDistantVOBase>(
                    APIControllerWrapper.getInstance().try_translate_vo_to_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).pre_update_vo),
                    APIControllerWrapper.getInstance().try_translate_vo_to_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).post_update_vo)
                );
                res.push(tmp);
            }
        }

        return JSON.stringify(res);
    }

    private set_ordered_vos_cud_from_JSON(jsoned: string): void {

        try {
            let res: any[] = JSON.parse(jsoned);

            for (let i in res) {
                let vo_cud = res[i];

                if (!!vo_cud['_type']) {
                    let tmp = APIControllerWrapper.getInstance().try_translate_vo_from_api(vo_cud);
                    this.ordered_vos_cud.push(tmp);
                } else {
                    let tmp = new DAOUpdateVOHolder<IDistantVOBase>(
                        APIControllerWrapper.getInstance().try_translate_vo_from_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).pre_update_vo),
                        APIControllerWrapper.getInstance().try_translate_vo_from_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).post_update_vo)
                    );
                    res.push(tmp);
                }
            }
        } catch (error) {
            ConsoleHandler.getInstance().error('Impossible de recharger le ordered_vos_cud from params :' + jsoned + ':');
        }
    }
}