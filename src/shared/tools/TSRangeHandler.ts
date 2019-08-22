import * as moment from 'moment';
import { Moment } from 'moment';
import IRange from '../modules/DataRender/interfaces/IRange';
import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import TSRange from '../modules/DataRender/vos/TSRange';
import VarControllerBase from '../modules/Var/VarControllerBase';
import DateHandler from './DateHandler';
import RangeHandler from './RangeHandler';
import TimeSegmentHandler from './TimeSegmentHandler';

export default class TSRangeHandler extends RangeHandler<Moment> {

    /**
     * DIRTY [ou pas?] Pseudo max int pour int8 en bdd (théotiquement -9223372036854775808 to 9223372036854775807
     *  /1000 par sécurité doute sur les conversions, anyway peu de chance que ça impact anything
     */
    public static MIN_TS: Moment = moment(-9223372036854);
    public static MAX_TS: Moment = moment(9223372036854);

    public static getInstance(): TSRangeHandler {
        if (!TSRangeHandler.instance) {
            TSRangeHandler.instance = new TSRangeHandler();
        }
        return TSRangeHandler.instance;
    }

    private static instance: TSRangeHandler = null;

    public getMaxRange(): TSRange {
        return this.createNew(TSRangeHandler.MIN_TS, TSRangeHandler.MAX_TS, true, true);
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public get_range_shifted_by_x_segments(range: TSRange, shift_value: number, shift_segment_type: number): TSRange {

        if (!range) {
            return null;
        }

        switch (shift_segment_type) {
            case TimeSegment.TYPE_MONTH:
                return this.createNew(moment(range.min).add(shift_value, 'month'), moment(range.max).add(shift_value, 'month'), range.min_inclusiv, range.max_inclusiv);
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                return this.createNew(moment(range.min).add(shift_value, 'year'), moment(range.max).add(shift_value, 'year'), range.min_inclusiv, range.max_inclusiv);
            case TimeSegment.TYPE_WEEK:
                return this.createNew(moment(range.min).add(shift_value, 'week'), moment(range.max).add(shift_value, 'week'), range.min_inclusiv, range.max_inclusiv);
            case TimeSegment.TYPE_DAY:
            default:
                return this.createNew(moment(range.min).add(shift_value, 'day'), moment(range.max).add(shift_value, 'day'), range.min_inclusiv, range.max_inclusiv);
        }
    }


    /**
     * TODO TU ASAP FIXME VARS
     * On passe par une version text pour simplifier
     */
    public translate_to_api(ranges: TSRange[]): string[] {
        let res: string[] = null;

        for (let i in ranges) {
            let range = ranges[i];

            if (res == null) {
                res = [];
            }

            let elt = '';
            elt += range.min_inclusiv ? '[' : '(';
            elt += range.min.unix();
            elt += ',';
            elt += range.max.unix();
            elt += range.max_inclusiv ? ']' : ')';

            res.push(elt);
        }

        return res;
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public translate_from_api<U extends TSRange>(ranges: string[]): U[] {

        let res: U[] = [];
        try {

            for (let i in ranges) {
                let range = ranges[i];

                res.push(this.parseRange(range));
            }
        } catch (error) {
        }

        if ((!res) || (!res.length)) {
            return null;
        }
        return res;
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public translate_to_bdd(ranges: TSRange[]): string {
        let res = null;

        for (let i in ranges) {
            let range: TSRange = ranges[i];

            if (res == null) {
                res = '{"';
            } else {
                res += ',"';
            }

            res += range.min_inclusiv ? '[' : '(';
            res += range.min.unix();
            res += ',';
            res += range.max.unix();
            res += range.max_inclusiv ? ']' : ')';

            res += '"';
        }
        res += "}";

        return res;
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public translate_from_bdd<U extends TSRange>(ranges: string[]): U[] {

        let res: U[] = [];
        try {

            for (let i in ranges) {
                let range = ranges[i];
                res.push(this.parseRange(range));
            }
        } catch (error) {
        }

        if ((!res) || (!res.length)) {
            return null;
        }
        return res;
    }

    /**
     * Strongly inspired by https://github.com/WhoopInc/node-pg-range/blob/master/lib/parser.js
     * @param rangeLiteral
     */
    public parseRange<U extends TSRange>(rangeLiteral: string): U {
        var matches = rangeLiteral.match(RangeHandler.RANGE_MATCHER);

        if (!matches) {
            return null;
        }

        try {
            let lower = parseInt(matches[2]) * 1000;
            let upper = parseInt(matches[4]) * 1000;
            return this.createNew(
                moment(lower),
                moment(upper),
                matches[1] == '[',
                matches[6] == ']');
        } catch (error) { }
        return null;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public getCardinal(range: TSRange, segment_type: number = TimeSegment.TYPE_DAY): number {
        if (!range) {
            return null;
        }

        let min: Moment = this.getSegmentedMin(range, segment_type);
        let max: Moment = this.getSegmentedMax(range, segment_type);

        if ((min == null) || (max == null)) {
            return null;
        }

        switch (segment_type) {
            case TimeSegment.TYPE_DAY:
                return max.diff(min, 'day') + 1;
            case TimeSegment.TYPE_MONTH:
                return max.diff(min, 'month') + 1;
            case TimeSegment.TYPE_WEEK:
                return max.diff(min, 'week') + 1;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                return max.diff(min, 'year') + 1;
        }

        return null;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public ranges_are_contiguous_or_intersect(range_a: TSRange, range_b: TSRange): boolean {

        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (this.range_intersects_range(range_a, range_b)) {
            return true;
        }

        // Reste à tester les ensembles contigus
        if (range_a.min_inclusiv != range_b.max_inclusiv) {
            if (range_a.min.isSame(range_b.max)) {
                return true;
            }
        }
        if (range_b.min_inclusiv != range_a.max_inclusiv) {
            if (range_b.min.isSame(range_a.max)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeStartB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.min_inclusiv && (!range_b.min_inclusiv)) {
            return range_a.min.isSameOrBefore(range_b.min);
        }
        return range_a.min.isBefore(range_b.min);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartASameStartB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.min_inclusiv != range_b.min_inclusiv) {
            return false;
        }
        return range_a.min.isSame(range_b.min);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeEndB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((!range_a.max_inclusiv) && range_b.max_inclusiv) {
            return range_a.max.isSameOrBefore(range_b.max);
        }
        return range_a.max.isBefore(range_b.max);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndASameEndB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.max_inclusiv != range_b.max_inclusiv) {
            return false;
        }
        return range_a.max.isSame(range_b.max);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeEndB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        return range_a.min.isBefore(range_b.max);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartASameEndB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((!range_a.min_inclusiv) || (!range_b.max_inclusiv)) {
            return false;
        }
        return range_a.min.isSame(range_b.max);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeStartB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((!range_a.max_inclusiv) || (!range_b.min_inclusiv)) {
            return range_a.max.isSameOrBefore(range_b.min);
        }
        return range_a.max.isBefore(range_b.min);
    }

    /**
     * Renvoie le plus petit ensemble permettant d'entourer les ranges passés en param
     * @param ranges
     */
    public getMinSurroundingRange(ranges: TSRange[]): TSRange {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: TSRange = null;

        for (let i in ranges) {
            let range = ranges[i];

            if (!range) {
                continue;
            }

            if (!res) {
                res = this.createNew(range.min, range.max, range.min_inclusiv, range.max_inclusiv);
                continue;
            }

            if ((res.min_inclusiv && range.min.isBefore(res.min)) || ((!res.min_inclusiv) && range.min.isSameOrBefore(res.min))) {
                res.min = moment(range.min);
                res.min_inclusiv = range.min_inclusiv;
            }

            if ((res.max_inclusiv && range.max.isAfter(res.max)) || ((!res.max_inclusiv) && range.max.isSameOrAfter(res.max))) {
                res.max = moment(range.max);
                res.max_inclusiv = range.max_inclusiv;
            }
        }

        return res;
    }

    public createNew<U extends IRange<Moment>>(start: Moment = null, end: Moment = null, start_inclusiv: boolean = null, end_inclusiv: boolean = null): U {
        return TSRange.createNew(start.clone(), end.clone(), start_inclusiv, end_inclusiv) as U;
    }

    public createNewForVar<U extends IRange<Moment>>(start: Moment = null, end: Moment = null, start_inclusiv: boolean = null, end_inclusiv: boolean = null, controller: VarControllerBase<any, any> = null): U {
        let finalEnd: Moment = end.clone();
        if (controller) {
            if (end_inclusiv) {
                TimeSegmentHandler.getInstance().incMoment(finalEnd, controller.segment_type, 1);
            }

            end_inclusiv = false;
        }
        return this.createNew(start, finalEnd, start_inclusiv, end_inclusiv) as U;
    }

    public cloneFrom<U extends IRange<Moment>>(from: U): U {
        return TSRange.cloneFrom(from) as U;
    }

    public getFormattedMinForAPI(range: TSRange): string {
        if (!range) {
            return null;
        }

        return DateHandler.getInstance().formatDateTimeForAPI(range.min);
    }

    public getFormattedMaxForAPI(range: TSRange): string {
        if (!range) {
            return null;
        }

        return DateHandler.getInstance().formatDateTimeForAPI(range.max);
    }

    public getValueFromFormattedMinOrMaxAPI(input: string): Moment {
        try {
            if (!input) {
                return null;
            }

            let resn = parseFloat(input);

            if (isNaN(resn)) {
                return null;
            }

            let res = moment(resn);

            if (!res.isValid()) {
                return null;
            }

            return res;
        } catch (error) {
        }
        return null;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin(range: TSRange, segment_type: number = TimeSegment.TYPE_DAY, offset: number = 0): Moment {


        if (!range) {
            return null;
        }

        let range_min_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(range.min, segment_type);
        let range_max_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(range.max, segment_type);

        if (range_min_ts.date.isAfter(range_max_ts.date)) {
            return null;
        }

        if ((!range.max_inclusiv) && (range_min_ts.date.isSameOrAfter(range_max_ts.date))) {
            return null;
        }

        if (!!offset) {
            TimeSegmentHandler.getInstance().incMoment(range_min_ts.date, segment_type, offset);
        }

        return range_min_ts.date;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax(range: TSRange, segment_type: number = TimeSegment.TYPE_DAY, offset: number = 0): Moment {

        if (!range) {
            return null;
        }

        let range_max_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(range.max, segment_type);

        if ((!range.max_inclusiv) && (range_max_ts.date.isSame(range.max.clone().utc(true)))) {
            TimeSegmentHandler.getInstance().decTimeSegment(range_max_ts);
        }

        let range_max_end_moment: Moment = TimeSegmentHandler.getInstance().getEndTimeSegment(range_max_ts);

        if (range_max_end_moment.isBefore(range.min.clone().utc(true))) {
            return null;
        }

        if ((!range.min_inclusiv) && (range_max_end_moment.isSameOrBefore(range.min.clone().utc(true)))) {
            return null;
        }

        if (!!offset) {
            TimeSegmentHandler.getInstance().incMoment(range_max_ts.date, segment_type, offset);
        }

        return range_max_ts.date;
    }


    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin_from_ranges(ranges: TSRange[], segment_type: number = TimeSegment.TYPE_DAY, offset: number = 0): Moment {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: Moment = null;

        for (let i in ranges) {
            let range = ranges[i];
            let range_min = this.getSegmentedMin(range, segment_type);

            if (res == null) {
                res = range_min;
            } else {
                res = moment.min(range_min, res);
            }
        }

        if (!!offset) {
            TimeSegmentHandler.getInstance().incMoment(res, segment_type, offset);
        }

        return res;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax_from_ranges(ranges: TSRange[], segment_type: number = TimeSegment.TYPE_DAY, offset: number = 0): Moment {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: Moment = null;

        for (let i in ranges) {
            let range = ranges[i];
            let range_max = this.getSegmentedMax(range, segment_type);

            if (res == null) {
                res = range_max;
            } else {
                res = moment.max(range_max, res);
            }
        }

        if (!!offset) {
            TimeSegmentHandler.getInstance().incMoment(res, segment_type, offset);
        }

        return res;
    }


    public async foreach(range: TSRange, callback: (value: Moment) => Promise<void> | void, segment_type: number = TimeSegment.TYPE_DAY, min_inclusiv: Moment = null, max_inclusiv: Moment = null) {

        let actual_moment: Moment = this.getSegmentedMin(range, segment_type);
        let end_moment: Moment = this.getSegmentedMax(range, segment_type);

        if ((actual_moment == null) || (end_moment == null) || (typeof actual_moment == 'undefined') || (typeof end_moment == 'undefined')) {
            return;
        }

        if ((!!min_inclusiv) && min_inclusiv.isValid()) {

            // FIXME : needs rework for timesegments < day
            min_inclusiv = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(min_inclusiv, segment_type).date;
            if (min_inclusiv.isAfter(actual_moment)) {
                actual_moment = min_inclusiv;
            }
        }

        if ((!!max_inclusiv) && max_inclusiv.isValid()) {

            // FIXME : needs rework for timesegments < day
            max_inclusiv = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(max_inclusiv, segment_type).date;
            if (max_inclusiv.isBefore(end_moment)) {
                end_moment = max_inclusiv;
            }
        }

        if (actual_moment.isAfter(end_moment)) {
            return;
        }

        while (actual_moment && actual_moment.isSameOrBefore(end_moment)) {

            await callback(actual_moment);
            TimeSegmentHandler.getInstance().incMoment(actual_moment, segment_type, 1);
        }
    }

    /**
     * @param elt
     * @param range
     */
    public is_elt_inf_min(a: Moment, range: TSRange): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (range.min_inclusiv) {
            return moment(a).isBefore(range.min);
        }
        return moment(a).isSameOrBefore(range.min);
    }

    /**
     * @param elt
     * @param range
     */
    public is_elt_sup_max(a: Moment, range: TSRange): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (range.max_inclusiv) {
            return moment(a).isAfter(range.max);
        }
        return moment(a).isSameOrAfter(range.max);
    }

    public isSupp(range: TSRange, a: Moment, b: Moment): boolean {
        return a.isAfter(b);
    }

    public isInf(range: TSRange, a: Moment, b: Moment): boolean {
        return a.isBefore(b);
    }

    public equals(range: TSRange, a: Moment, b: Moment): boolean {
        return a.isSame(b);
    }


    public max(range: TSRange, a: Moment, b: Moment): Moment {
        return moment.max(a, b);
    }

    public min(range: TSRange, a: Moment, b: Moment): Moment {
        return moment.min(a, b);
    }
}