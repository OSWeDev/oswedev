import * as moment from 'moment';
import { Moment } from 'moment';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import DateHandler from '../../../shared/tools/DateHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import VarsServerController from './VarsServerController';

/**
 * L'objectif est de créer un proxy d'accès aux données des vars_datas en base pour qu'on puisse intercaler un buffer de mise à jour progressif en BDD
 *  De cette manière, on peut ne pas attendre de mettre à ajour en bdd avant de refaire un batch de calcul et pour autant profiter de ces valeurs calculées et pas en base
 *  On cherchera alors à dépiler ce buffer dès qu'on a moins de calculs en cours et donc moins besoin de ressources pour les calculs
 */
export default class VarsDatasProxy {

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */
    public static getInstance(): VarsDatasProxy {
        if (!VarsDatasProxy.instance) {
            VarsDatasProxy.instance = new VarsDatasProxy();
        }
        return VarsDatasProxy.instance;
    }

    private static instance: VarsDatasProxy = null;

    /**
     * Version liste pour prioriser les demandes
     */
    private vars_datas_buffer: VarDataBaseVO[] = [];

    protected constructor() {
    }

    /**
     * A utiliser pour prioriser normalement la demande - FIFO
     *  Cas standard
     */
    public append_var_datas(var_datas: VarDataBaseVO[]) {
        if ((!var_datas) || (!var_datas.length)) {
            return;
        }
        this.vars_datas_buffer = this.vars_datas_buffer.concat(var_datas);
    }

    /**
     * A utiliser pour prioriser la demande par rapport à toutes les autres - LIFO
     *  Principalement pour le cas d'une demande du navigateur client, on veut répondre ASAP
     *  et si on doit ajuster le calcul on renverra l'info plus tard
     */
    public prepend_var_datas(var_datas: VarDataBaseVO[]) {
        if ((!var_datas) || (!var_datas.length)) {
            return;
        }
        var_datas.forEach((vd) => this.vars_datas_buffer.unshift(vd));
    }

    /**
     * On indique en param le nombre de vars qu'on accepte de gérer dans le buffer
     *  Le dépilage se fait dans l'ordre de la déclaration, via une itération
     *  Si un jour l'ordre diffère dans JS, on passera sur une liste en FIFO, c'est le but dans tous les cas
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon
     */
    public async handle_buffer(limit: number): Promise<number> {

        while ((limit > 0) && this.vars_datas_buffer.length) {

            await ModuleDAO.getInstance().insertOrUpdateVO(this.vars_datas_buffer[0]);
            this.vars_datas_buffer.splice(0, 1);
            limit--;
        }

        return limit;
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     */
    public async get_exact_param_from_buffer_or_bdd<T extends VarDataBaseVO>(var_data: T): Promise<T> {

        let test = this.vars_datas_buffer.filter((vd: VarDataBaseVO) => vd.index == var_data.index);
        if (test && test.length) {
            return test[0] as T;
        }

        if (var_data.id) {
            return await ModuleDAO.getInstance().getVoById<T>(var_data._type, var_data.id, VOsTypesManager.getInstance().moduleTables_by_voType[var_data._type].get_segmented_field_raw_value_from_vo(var_data));
        }

        let res: T[] = await ModuleDAO.getInstance().getVosByExactMatroids<T, T>(var_data._type, [var_data], null);

        if (res && res.length) {
            return res[0];
        }
        return null;
    }

    /**
     * On charge en priorité depuis le buffer, puisque si le client demande des calculs on va les mettre en priorité ici, avant de calculer puis les remettre en attente d'insertion en base
     *  (dont en fait elles partent juste jamais)
     * @param request_limit nombre max de vars_datas à renvoyer
     */
    public async get_vars_to_compute_from_buffer_or_bdd(request_limit: number): Promise<{ [index: string]: VarDataBaseVO }> {

        let res: { [index: string]: VarDataBaseVO } = {};

        /**
         * On commence par collecter le max de datas depuis le buffer : Les conditions de sélection d'un var :
         *  - est-ce que la data a une valeur undefined ? oui => sélectionnée
         *  - est-ce que la data peut expirer et a expiré ? oui => sélectionnée
         */
        for (let i in this.vars_datas_buffer) {

            if (request_limit <= 0) {
                return res;
            }

            let var_data = this.vars_datas_buffer[i];

            if (!var_data.has_valid_value) {
                res[var_data.index] = var_data;
                request_limit--;
                continue;
            }
        }

        if (request_limit <= 0) {
            return res;
        }

        /**
         * Attention : à ce stade en base on va trouver des datas qui sont pas computed mais qu'on retrouve par exemple comme computed
         *  et valide (donc pas sélectionnées) dans le buffer d'attente de mise à jour en bdd. Donc on doit ignorer tous les ids
         *  des vars qui sont dans le buffer... (avantage ça concerne pas celles qui sont pas créées puisqu'il faut un id et la liste
         *  des ids reste relativement dense)...
         */
        let bdd_datas: { [index: string]: VarDataBaseVO } = await this.get_vars_to_compute_from_bdd(request_limit, this.vars_datas_buffer.filter((data) => !!data.id).map((data) => data.id));
        for (let i in bdd_datas) {
            let bdd_data = bdd_datas[i];

            res[bdd_data.index] = bdd_data;
        }

        return res;
    }

    /**
     * TODO FIXME REFONTE VARS c'est à que la plus grosse opti doit se faire, et peut-etre via du machine learning par ce que pas évident de savoir quelle est la bonne strat
     *  Il faut à tout prix pouvoir monitorer la performance de cette fonction
     */
    private async get_vars_to_compute_from_bdd(request_limit: number, ignore_ids_list: number[]): Promise<{ [index: string]: VarDataBaseVO }> {
        let vars_datas: { [index: string]: VarDataBaseVO } = {};
        let nb_vars_datas: number = 0;

        // OPTI TODO : possible de regrouper les requetes d'une meme api_type_id, en préparant en amont les condition de la requête et en faisant pour tous les var_id en 1 fois
        for (let api_type_id in VarsServerController.getInstance().varcacheconf_by_api_type_ids) {

            if (request_limit <= nb_vars_datas) {
                return vars_datas;
            }

            let varcacheconf_by_var_ids = VarsServerController.getInstance().varcacheconf_by_api_type_ids[api_type_id];
            for (let var_id in varcacheconf_by_var_ids) {
                let varcacheconf: VarCacheConfVO = varcacheconf_by_var_ids[var_id];

                // On doit aller chercher toutes les varsdatas connues pour être cachables (on se fout du var_id à ce stade on veut juste des api_type_ids des varsdatas compatibles)
                //  Attention les données importées ne doivent pas être remises en question
                let vars_datas_tmp: VarDataBaseVO[] = [];
                if (!!varcacheconf.cache_timeout_ms) {
                    let timeout: Moment = moment().utc(true).add(-varcacheconf.cache_timeout_ms, 'ms');
                    vars_datas_tmp = await ModuleDAOServer.getInstance().selectAll<VarDataBaseVO>(api_type_id, ' where ' +
                        ' var_id = ' + varcacheconf.var_id +
                        ' and (value_ts is null or value_ts < ' + DateHandler.getInstance().getUnixForBDD(timeout) + ') ' +
                        ((ignore_ids_list && ignore_ids_list.length) ? ' and id not in $1' : '') +
                        ' and value_type != ' + VarDataBaseVO.VALUE_TYPE_COMPUTED +
                        ' limit ' + request_limit + ';', [ignore_ids_list]);
                } else {
                    vars_datas_tmp = await ModuleDAOServer.getInstance().selectAll<VarDataBaseVO>(api_type_id, ' where ' +
                        ' value_ts is null' +
                        ' and var_id = ' + varcacheconf.var_id +
                        ((ignore_ids_list && ignore_ids_list.length) ? ' and id not in $1' : '') +
                        ' and value_type != ' + VarDataBaseVO.VALUE_TYPE_COMPUTED +
                        ' limit ' + request_limit + ';', [ignore_ids_list]);
                }

                for (let vars_datas_tmp_i in vars_datas_tmp) {
                    if (nb_vars_datas >= request_limit) {
                        return vars_datas;
                    }

                    let var_data_tmp = vars_datas_tmp[vars_datas_tmp_i];

                    nb_vars_datas++;
                    vars_datas[var_data_tmp.index] = var_data_tmp;
                }
                if (nb_vars_datas >= request_limit) {
                    return vars_datas;
                }
            }
            if (nb_vars_datas >= request_limit) {
                return vars_datas;
            }
        }

        return vars_datas;
    }
}