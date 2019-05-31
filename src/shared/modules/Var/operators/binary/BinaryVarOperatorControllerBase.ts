import IDataSourceController from '../../../DataSource/interfaces/IDataSourceController';
import VarDAG from '../../graph/var/VarDAG';
import VarDAGNode from '../../graph/var/VarDAGNode';
import ISimpleNumberVarData from '../../interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';
import SimpleVarConfVO from '../../simple_vars/SimpleVarConfVO';
import VarControllerBase from '../../VarControllerBase';
import VarDataParamControllerBase from '../../VarDataParamControllerBase';
import VarsController from '../../VarsController';
import BinaryVarOperatorsController from './BinaryVarOperatorsController';

export default abstract class BinaryVarOperatorControllerBase<
    TDataLeft extends ISimpleNumberVarData,
    TDataParamLeft extends IVarDataParamVOBase,
    TDataRight extends ISimpleNumberVarData,
    TDataParamRight extends IVarDataParamVOBase,
    TData extends ISimpleNumberVarData,
    TDataParam extends IVarDataParamVOBase> extends VarControllerBase<TData, TDataParam> {

    public constructor(
        protected left_var: VarControllerBase<TDataLeft, any>,
        protected operator_name: string,
        protected right_var: VarControllerBase<TDataRight, any>,
        var_data_api_type_id: string,
        protected varDataConstructor: () => TData,
        data_param_controller: VarDataParamControllerBase<TDataParam>) {
        super({
            _type: SimpleVarConfVO.API_TYPE_ID,
            id: null,
            var_data_vo_type: var_data_api_type_id,
            name: BinaryVarOperatorsController.getInstance().getName(left_var.varConf.name, operator_name, right_var.varConf.name),
        } as SimpleVarConfVO, data_param_controller);
    }

    public getDataSourcesDependencies(): Array<IDataSourceController<any, any>> {
        return [];
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     */
    public getVarsIdsDependencies(): number[] {
        return [this.left_var.varConf.id, this.right_var.varConf.id];
    }

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     */
    public async getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): Promise<IVarDataParamVOBase[]> {

        return [this.get_left_param(varDAGNode, varDAG), this.get_right_param(varDAGNode, varDAG)];
    }

    public async updateData(varDAGNode: VarDAGNode, varDAG: VarDAG) {

        let param: TDataParam = varDAGNode.param as TDataParam;
        let index: string = VarsController.getInstance().getIndex(param);

        // Si importé, on renvoie la valeur importée, sinon on fait le calcul
        if (VarsController.getInstance().varDAG.nodes[index].hasMarker(VarDAG.VARDAG_MARKER_IMPORTED_DATA)) {

            VarsController.getInstance().setVarData(VarsController.getInstance().varDAG.nodes[index].imported, true);
            return;
        }

        let res: TData = Object.assign(this.varDataConstructor(), param);
        res.types_info = [];
        res.var_id = this.varConf.id;

        let data_left: TDataLeft = VarsController.getInstance().getVarData(this.get_left_param(varDAGNode, varDAG), true);
        let data_right: TDataRight = VarsController.getInstance().getVarData(this.get_right_param(varDAGNode, varDAG), true);

        res.value = this.calc_value(data_left, data_right);
        VarsController.getInstance().setVarData(res, true);
    }

    protected abstract calc_value(left_data: TDataLeft, right_data: TDataRight): number;

    protected get_left_param(varDAGNode: VarDAGNode, varDAG: VarDAG): TDataParamLeft {
        let param: TDataParam = varDAGNode.param as TDataParam;

        let res: TDataParamLeft = Object.assign({}, param) as any;
        res.var_id = this.left_var.varConf.id;
        return res;
    }

    protected get_right_param(varDAGNode: VarDAGNode, varDAG: VarDAG): TDataParamRight {
        let param: TDataParam = varDAGNode.param as TDataParam;

        let res: TDataParamRight = Object.assign({}, param) as any;
        res.var_id = this.right_var.varConf.id;
        return res;
    }
}