import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import VarConfVOBase from './vos/VarConfVOBase';
import VarDataBaseVO from './vos/VarDataBaseVO';

export default class VarsInitController {

    public static getInstance(): VarsInitController {
        if (!VarsInitController.instance) {
            VarsInitController.instance = new VarsInitController();
        }
        return VarsInitController.instance;
    }

    private static instance: VarsInitController = null;

    public register_var_data(
        api_type_id: string,
        constructor: () => VarDataBaseVO,
        var_fields: Array<ModuleTableField<any>>,
        module: Module = null): ModuleTable<any> {
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf');

        var_fields.unshift(var_id);
        var_fields = var_fields.concat([
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur'),
            new ModuleTableField('value_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, VarDataBaseVO.VALUE_TYPE_COMPUTED).setEnumValues({
                [VarDataBaseVO.VALUE_TYPE_IMPORT]: VarDataBaseVO.VALUE_TYPE_LABELS[VarDataBaseVO.VALUE_TYPE_IMPORT],
                [VarDataBaseVO.VALUE_TYPE_COMPUTED]: VarDataBaseVO.VALUE_TYPE_LABELS[VarDataBaseVO.VALUE_TYPE_COMPUTED]
            }),
            new ModuleTableField('value_ts', ModuleTableField.FIELD_TYPE_tstz, 'Date mise à jour').set_segmentation_type(TimeSegment.TYPE_SECOND),
        ]);

        let datatable = new ModuleTable(module, api_type_id, constructor, var_fields, null).defineAsMatroid();
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVOBase.API_TYPE_ID]);
        if (!!module) {
            module.datatables.push(datatable);
        }
        return datatable;
    }
}