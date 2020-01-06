import { cloneDeep } from 'lodash';
import ConsoleHandler from '../../tools/ConsoleHandler';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';
import TimeSegment from '../DataRender/vos/TimeSegment';
import IDataSourceController from '../DataSource/interfaces/IDataSourceController';
import IMatroid from '../Matroid/interfaces/IMatroid';
import VarDAG from './graph/var/VarDAG';
import VarDAGNode from './graph/var/VarDAGNode';
import IDateIndexedVarDataParam from './interfaces/IDateIndexedVarDataParam';
import ISimpleNumberVarMatroidData from './interfaces/ISimpleNumberVarMatroidData';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import VarDataParamControllerBase from './VarDataParamControllerBase';
import VarsController from './VarsController';
import VarConfVOBase from './vos/VarConfVOBase';
import moment = require('moment');

export default abstract class VarControllerBase<TData extends IVarDataVOBase & TDataParam, TDataParam extends IVarDataParamVOBase> {

    /**
     * Used for every segmented data, defaults to day segmentation. Used for cumuls, and refining use of the param.date_index
     */
    public abstract segment_type: number;

    /**
     * Déclarer une var comme calculable côté serveur
     */
    public is_computable_server_side: boolean = true;

    /**
     * Déclarer une var comme calculable côté client
     */
    public is_computable_client_side: boolean = true;

    /**
     * On declare passer par le système de calcul optimisé des imports plutôt que par le système standard.
     *  ça optimise énormément les calculs mais ça nécessite des paramètrages et c'est pas toujours compatible
     */
    public can_use_optimized_imports_calculation: boolean = false;

    /**
     * Permet d'indiquer au système de calcul optimisé des imports entre autre les champs qui sont déclarés par combinaison
     *  (et dons sur lesquels on fait une recherche exacte et pas par inclusion comme pour les champs atomiques)
     * On stocke le segment_type. Cela signifie que le champs est obligatoirement normalisé, et qu'on a un découpage suivant le segment_type
     *  en ordre croissant en base. Très important par ce que [a,b] c'est différent de [b,a] pour la base. Même si ça couvre les mêmes ensembles
     */
    public datas_fields_type_combinatory: { [matroid_field_id: string]: number } = {};

    /**
     * Déclarer qu'une var n'utilise que des imports et/ou precompiled qui sont dissociés - cardinal 1 (atomiques)
     */
    public has_only_atomique_imports_or_precompiled_datas: boolean = false;

    /**
     * Déclarer une var comme pouvant utiliser des datas precompilées ou importées côté serveur
     */
    public can_load_precompiled_or_imported_datas_server_side: boolean = true;

    /**
     * Déclarer une var comme pouvant utiliser des datas precompilées ou importées côté client
     */
    public can_load_precompiled_or_imported_datas_client_side: boolean = true;

    protected constructor(
        public varConf: VarConfVOBase,
        public varDataParamController: VarDataParamControllerBase<TData, TDataParam>) {
    }

    public async initialize() {
        this.varConf = await VarsController.getInstance().registerVar(this.varConf, this);
    }

    /**
     * Returns the datasources this var depends on
     */
    public abstract getDataSourcesDependencies(): Array<IDataSourceController<any, any>>;

    /**
     * Returns the datasources this var depends on predeps
     */
    public getDataSourcesPredepsDependencies(): Array<IDataSourceController<any, any>> {
        return null;
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     */
    public abstract getVarsIdsDependencies(): number[];

    public computeValue(varDAGNode: VarDAGNode, varDAG: VarDAG) {

        let res: TData = null;

        if ((!!varDAGNode.computed_datas_matroids) && (!!varDAGNode.loaded_datas_matroids)) {

            // Si on est sur des matroids, on doit créer la réponse nous mêmes
            //  en additionnant les imports/précalculs + les res de calcul des computed matroids
            //  le datafound est true si l'un des computed est true
            let res_matroid: ISimpleNumberVarMatroidData = Object.assign({}, varDAGNode.param as TDataParam) as any;

            res_matroid.value = varDAGNode.loaded_datas_matroids_sum_value;

            for (let i in varDAGNode.computed_datas_matroids) {
                let data_matroid_to_compute = varDAGNode.computed_datas_matroids[i];

                let computed_datas_matroid_res: ISimpleNumberVarMatroidData = this.updateData(varDAGNode, varDAG, data_matroid_to_compute) as any;

                if (res_matroid.value == null) {
                    res_matroid.value = computed_datas_matroid_res.value;
                } else {
                    res_matroid.value += computed_datas_matroid_res.value;
                }
            }

            res = res_matroid as any;
        } else {
            res = this.updateData(varDAGNode, varDAG);
        }

        if (!res) {
            ConsoleHandler.getInstance().error('updateData should return res anyway');
            res = cloneDeep(varDAGNode.param) as TData;
            res.value_type = VarsController.VALUE_TYPE_COMPUTED;
        }

        // On aggrège au passage les missing_datas_infos des childs vers ce noeud :
        if ((typeof res.missing_datas_infos === 'undefined') || (!res.missing_datas_infos)) {
            res.missing_datas_infos = [];
        }

        for (let i in varDAGNode.outgoingNames) {
            let outgoing_name = varDAGNode.outgoingNames[i];
            let outgoing_data = VarsController.getInstance().getVarData(varDAGNode.outgoing[outgoing_name].param, true);

            if (outgoing_data && outgoing_data.missing_datas_infos && outgoing_data.missing_datas_infos.length) {

                res.missing_datas_infos = res.missing_datas_infos.concat(outgoing_data.missing_datas_infos);
            }
        }

        VarsController.getInstance().setVarData(res, true);
    }

    public getSegmentedParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): IVarDataParamVOBase[] {

        let res: IVarDataParamVOBase[] = this.getParamDependencies(varDAGNode, varDAG);
        let res_: IVarDataParamVOBase[] = [];

        for (let i in res) {

            let param = res[i];

            // TODO FIXME ASAP VARS : On intègre ici et dans le Varscontroller la gestion du reset des compteurs,
            //  puisque [0, 50] sur un reset à 30 ça équivaut strictement à [30,50]

            let check_res: boolean = VarsController.getInstance().check_tsrange_on_resetable_var(param);
            if (!check_res) {
                continue;
            }

            // DIRTY : on fait un peu au pif ici un filtre sur le date_index...

            if (!!(param as IDateIndexedVarDataParam).date_index) {
                (param as IDateIndexedVarDataParam).date_index = VarsController.getInstance().getVarControllerById(param.var_id).getTimeSegment(param).dateIndex;
            }

            res_.push(param);
        }

        return res_;
    }

    /**
     * NEEDS to go protected
     */
    public abstract getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): IVarDataParamVOBase[];

    protected getTimeSegment(param: TDataParam): TimeSegment {
        let date_index: string = ((param as any) as IDateIndexedVarDataParam).date_index;

        return TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(date_index), this.segment_type);
    }

    protected abstract updateData(varDAGNode: VarDAGNode, varDAG: VarDAG, matroid_to_compute?: IMatroid): TData;

    protected push_missing_datas_infos(var_data: TData, translatable_code: string) {
        if (!var_data) {
            return;
        }

        if (!var_data.missing_datas_infos) {
            var_data.missing_datas_infos = [];
        }

        var_data.missing_datas_infos.push(translatable_code);
    }
}