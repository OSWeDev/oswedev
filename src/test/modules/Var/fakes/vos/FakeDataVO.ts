import { Moment } from 'moment';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';

export default class FakeDataVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "fake_data";

    public id: number;
    public _type: string = FakeDataVO.API_TYPE_ID;

    public var_id: number;

    public value: number;
    public ts_ranges: TSRange[];

    public value_type: number;
    public value_ts: Moment;
}