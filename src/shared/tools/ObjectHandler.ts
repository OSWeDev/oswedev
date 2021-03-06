import NumRange from '../modules/DataRender/vos/NumRange';
import TSRange from '../modules/DataRender/vos/TSRange';
import IDistantVOBase from '../modules/IDistantVOBase';
import ConsoleHandler from './ConsoleHandler';
import RangeHandler from './RangeHandler';
const moment = require('moment');

export default class ObjectHandler {

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): ObjectHandler {
        if (!ObjectHandler.instance) {
            ObjectHandler.instance = new ObjectHandler();
        }
        return ObjectHandler.instance;
    }

    private static instance: ObjectHandler = null;

    private constructor() {
    }

    public sortObjectByKey(obj: {}, sort_func = null): {} {
        var keys = [];
        var sorted_obj = {};

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        if (!!sort_func) {
            keys.sort(sort_func);
        } else {
            keys.sort();
        }

        for (let i in keys) {
            let key = keys[i];
            sorted_obj[key] = obj[key];
        }

        return sorted_obj;
    }

    public arrayFromMap<T>(map: { [i: number]: T }): T[] {
        let res: T[] = [];

        for (let i in map) {
            res.push(map[i]);
        }
        return res;
    }

    public mapByNumberFieldFromArray<T>(a: T[], map_index_field_id: string): { [i: number]: T } {
        let res: { [i: number]: T } = {};

        for (let i in a) {
            let e = a[i];
            res[e[map_index_field_id]] = e;
        }
        return res;
    }

    public mapByStringFieldFromArray<T>(a: T[], map_index_field_id: string): { [i: string]: T } {
        let res: { [i: string]: T } = {};

        for (let i in a) {
            let e = a[i];
            res[e[map_index_field_id]] = e;
        }
        return res;
    }

    public mapFromIdsArray(a: number[]): { [i: number]: boolean } {
        let res: { [i: number]: boolean } = {};

        for (let i in a) {
            res[a[i]] = true;
        }
        return res;
    }

    public getIdsList(vos: IDistantVOBase[] | { [id: number]: IDistantVOBase }): number[] {
        let res: number[] = [];

        for (let i in vos) {
            if (!vos[i]) {
                continue;
            }
            res.push(vos[i].id);
        }
        return res;
    }

    /**
     * @param map The map of type {[index:number] : any} from which we want to extract the indexes as number[]
     */
    public getNumberMapIndexes(map: { [index: number]: any }): number[] {
        let res: number[] = [];

        for (let i in map) {
            try {
                res.push(parseInt(i.toString()));
            } catch (error) {
                ConsoleHandler.getInstance().error(error);
            }
        }
        return res;
    }

    public hasData(object): boolean {
        return (object != null) && (typeof object != "undefined");
    }

    /**
     * Returns true if the object has an attribute, even if the attribute is valued to null
     * @param object
     */
    public hasAtLeastOneAttribute(object): boolean {
        for (let i in object) {
            return true;
        }

        return false;
    }


    /**
     * Returns true if the object has an attribute, even if the attribute is valued to null
     * @param object
     */
    public hasOneAndOnlyOneAttribute(object): boolean {

        let res: boolean = false;
        for (let i in object) {

            if (!res) {
                res = true;
            } else {
                return false;
            }
        }

        return res;
    }
    /**
     * Returns first attribute value and destroys it. Might not work if object[i] is an object ? since we return a ref to a var we delete right next ...
     * @param object
     */
    public shiftAttribute(object): any {
        for (let i in object) {
            let res = object[i];
            delete object[i];
            return res;
        }

        return null;
    }

    /**
     * Returns first attribute value and destroys it. Might not work if object[i] is an object ? since we return a ref to a var we delete right next ...
     * @param object
     */
    public getFirstAttributeName(object): any {
        for (let i in object) {
            return i;
        }

        return null;
    }

    /**
     * Returns the path if exists in the object
     */
    public getPathInObject(object, path: string): any {

        if ((!path) || (!object)) {
            return null;
        }

        let path_elts = path.split('.');
        let e = object;

        for (let i in path_elts) {
            let path_elt = path_elts[i];

            if (!e[path_elt]) {
                return null;
            }
            e = e[path_elt];
        }

        return e;
    }


    public filterVosIdsByNumRange<T>(elts_by_id: { [id: number]: T }, range: NumRange): { [id: number]: T } {
        let res: { [id: number]: T } = {};

        for (let id in elts_by_id) {
            let elt = elts_by_id[id];

            if (RangeHandler.getInstance().elt_intersects_range(parseInt(id.toString()), range)) {
                if (typeof elt != 'undefined') {
                    res[id] = elt;
                }
            }
        }

        return res;
    }

    public filterVosIdsByNumRanges<T>(elts_by_id: { [id: number]: T }, ranges: NumRange[]): { [id: number]: T } {
        let res: { [id: number]: T } = {};

        for (let id in elts_by_id) {
            let elt = elts_by_id[id];

            if (RangeHandler.getInstance().elt_intersects_any_range(parseInt(id.toString()), ranges)) {
                res[id] = elt;
            }
        }

        return res;
    }

    public filterVosDateIndexesByTSRange<T extends IDistantVOBase>(elts_by_date_index: { [date_index: string]: T }, range: TSRange): { [date_index: string]: T } {
        let res: { [date_index: string]: T } = {};

        for (let date_index in elts_by_date_index) {
            let elt = elts_by_date_index[date_index];

            if (RangeHandler.getInstance().elt_intersects_range(moment(date_index).startOf('day').utc(true), range)) {
                res[date_index] = elt;
            }
        }

        return res;
    }

    public filterVosDateIndexesByTSRanges<T>(elts_by_date_index: { [date_index: string]: T }, ranges: TSRange[]): { [date_index: string]: T } {
        let res: { [date_index: string]: T } = {};

        for (let date_index in elts_by_date_index) {
            let elt = elts_by_date_index[date_index];

            if (RangeHandler.getInstance().elt_intersects_any_range(moment(date_index).startOf('day').utc(true), ranges)) {
                res[date_index] = elt;
            }
        }

        return res;
    }
}