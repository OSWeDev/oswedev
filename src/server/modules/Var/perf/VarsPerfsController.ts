import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import MatroidController from '../../../../shared/modules/Matroid/MatroidController';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarCacheConfVO from '../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarPerfVO from '../../../../shared/modules/Var/vos/VarPerfVO';
import PerfMonConfController from '../../PerfMon/PerfMonConfController';
import PerfMonServerController from '../../PerfMon/PerfMonServerController';
import VarsPerfMonServerController from '../VarsPerfMonServerController';

/**
 * Par convention on appel toujours __NAME ou [VAR_ID]__NAME les points de traking de perfs
 */
export default class VarsPerfsController {

    /**
     * Local thread cache ----- n'existe que sur le thread de calculs
     */

    public static current_batch_perfs: { [perf_name: string]: VarPerfVO } = {};

    public static max_nb_calls: number = 100;
    public static max_nb_card: number = 10000;
    public static max_sum_ms: number = 30000;


    /**
     * ----- Local thread cache
     */

    public static addPerf(ms: number, perf_name: string, is_start: boolean) {
        if (!VarsPerfsController.current_batch_perfs[perf_name]) {
            let perf = new VarPerfVO();
            perf.nb_calls = 0;
            perf.sum_ms = 0;
            perf.name = perf_name;

            let split = perf_name.split('__')[0];
            if (/^[0-9]+$/.test(split)) {
                perf.var_id = parseInt(split);
            }
            VarsPerfsController.current_batch_perfs[perf_name] = perf;
        }

        VarsPerfsController.current_batch_perfs[perf_name].sum_ms += is_start ? -ms : ms;
        if (is_start) { VarsPerfsController.current_batch_perfs[perf_name].nb_calls++; }
    }

    public static addCard(node: VarDAGNode) {

        let cards: number = MatroidController.getInstance().get_cardinal(node.var_data);
        let var_id: number = node.var_data.var_id;

        for (let i in VarsPerfsController.current_batch_perfs) {
            let current_batch_perf = VarsPerfsController.current_batch_perfs[i];

            if (current_batch_perf.name.startsWith(var_id + '__')) {

                let perf_id = current_batch_perf.name.substring(current_batch_perf.name.lastIndexOf('.') + 1, current_batch_perf.name.length);
                if (!node['has_' + perf_id + '_perf']) {
                    continue;
                }
                current_batch_perf.nb_card = (current_batch_perf.nb_card ? current_batch_perf.nb_card : 0) + cards;
            }
        }
    }

    public static addPerfs(ms: number, perf_names: string[], is_start: boolean) {
        perf_names.forEach((perf_name) => VarsPerfsController.addPerf(ms, perf_name, is_start));
    }

    public static async update_perfs_in_bdd() {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsPerfsController__update_perfs_in_bdd],
            async () => {

                let mean_per_cardinal_1000_per_var_id: { [var_id: number]: number } = {};

                /**
                 * On charge les datas de mêmes noms issues de la bdd
                 */
                for (let i in VarsPerfsController.current_batch_perfs) {
                    let current_batch_perf = VarsPerfsController.current_batch_perfs[i];
                    let bdd_data = await ModuleDAO.getInstance().getNamedVoByName<VarPerfVO>(VarPerfVO.API_TYPE_ID, current_batch_perf.name);

                    if (!!bdd_data) {
                        current_batch_perf.nb_calls = (current_batch_perf.nb_calls ? current_batch_perf.nb_calls : 0) + (bdd_data.nb_calls ? bdd_data.nb_calls : 0);
                        current_batch_perf.nb_card = (current_batch_perf.nb_card ? current_batch_perf.nb_card : 0) + (bdd_data.nb_card ? bdd_data.nb_card : null);
                        current_batch_perf.sum_ms = (current_batch_perf.sum_ms ? current_batch_perf.sum_ms : 0) + (bdd_data.sum_ms ? bdd_data.sum_ms : 0);
                        current_batch_perf.id = bdd_data.id;
                    }

                    // Pour limiter les dépassements on fixe un max à ne pas dépasser et on ramène les historiques dans la limite si ça dépasse
                    if ((current_batch_perf.nb_calls < 0) || (current_batch_perf.nb_card < 0) || (current_batch_perf.sum_ms < 0)) {
                        // si déjà <0, on doit juste repartir de 0 c'est n'imp
                        current_batch_perf.nb_calls = 0;
                        current_batch_perf.nb_card = 0;
                        current_batch_perf.sum_ms = 0;
                    }

                    if ((current_batch_perf.nb_calls > this.max_nb_calls) || (current_batch_perf.nb_card > this.max_nb_card) || (current_batch_perf.sum_ms > this.max_sum_ms)) {
                        // on fixe des limites arbitraires
                        let coef_nb_calls = (current_batch_perf.nb_calls / this.max_nb_calls) * 3;
                        let coef_nb_card = (current_batch_perf.nb_card / this.max_nb_card) * 3;
                        let coef_sum_ms = (current_batch_perf.sum_ms / this.max_sum_ms) * 3;
                        let coef = Math.max(coef_nb_calls, coef_nb_card, coef_sum_ms);
                        current_batch_perf.nb_calls = current_batch_perf.nb_calls / coef;
                        current_batch_perf.nb_card = current_batch_perf.nb_card / coef;
                        current_batch_perf.sum_ms = current_batch_perf.sum_ms / coef;
                    }

                    current_batch_perf.mean_per_call = current_batch_perf.nb_calls ? (current_batch_perf.sum_ms / current_batch_perf.nb_calls) : null;
                    current_batch_perf.mean_per_cardinal_1000 = current_batch_perf.nb_card ? (current_batch_perf.sum_ms / (current_batch_perf.nb_card / 1000)) : null;

                    if (current_batch_perf.var_id) {
                        if (!mean_per_cardinal_1000_per_var_id[current_batch_perf.var_id]) {
                            mean_per_cardinal_1000_per_var_id[current_batch_perf.var_id] = current_batch_perf.mean_per_cardinal_1000;
                        } else {
                            mean_per_cardinal_1000_per_var_id[current_batch_perf.var_id] += current_batch_perf.mean_per_cardinal_1000;
                        }
                    }

                    await ModuleDAO.getInstance().insertOrUpdateVO(current_batch_perf);
                }

                /**
                 * On update les varcacheconfs pour mettre la valeur de tps de calcul moyen / 1000 card
                 */
                for (let var_id_s in mean_per_cardinal_1000_per_var_id) {
                    let var_id = parseInt(var_id_s);

                    let vars_cache_conf: VarCacheConfVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<VarCacheConfVO>(VarCacheConfVO.API_TYPE_ID, "var_id", [var_id]);
                    let var_cache_conf: VarCacheConfVO = (vars_cache_conf && vars_cache_conf.length) ? vars_cache_conf[0] : null;

                    if (!var_cache_conf) {
                        continue;
                    }

                    if (mean_per_cardinal_1000_per_var_id[var_id_s] == null) {
                        continue;
                    }

                    var_cache_conf.calculation_cost_for_1000_card = mean_per_cardinal_1000_per_var_id[var_id_s];
                    await ModuleDAO.getInstance().insertOrUpdateVO(var_cache_conf);
                }


                VarsPerfsController.current_batch_perfs = {};
            },
            this
        );
    }
}