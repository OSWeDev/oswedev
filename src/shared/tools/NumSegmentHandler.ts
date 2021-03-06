import NumRange from '../modules/DataRender/vos/NumRange';
import NumSegment from '../modules/DataRender/vos/NumSegment';
import RangeHandler from './RangeHandler';

export default class NumSegmentHandler {

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): NumSegmentHandler {
        if (!NumSegmentHandler.instance) {
            NumSegmentHandler.instance = new NumSegmentHandler();
        }
        return NumSegmentHandler.instance;
    }

    private static instance: NumSegmentHandler = null;

    private constructor() { }

    public getBiggestNumSegmentationType(segment_type_a: number, segment_type_b: number): number {
        return NumSegment.TYPE_INT;
    }

    public getSmallestNumSegmentationType(segment_type_a: number, segment_type_b: number): number {
        return NumSegment.TYPE_INT;
    }

    /**
     * Renvoi 1 si le semgent_type a est plus grand que b, -1 si plus petit, 0 si égaux
     * @param segment_type_a
     * @param segment_type_b
     */
    public compareSegmentTypes(segment_type_a: number, segment_type_b: number): number {
        return 0;
    }

    /**
     * ATTENTION : modifie le TS sans copie
     * @param timeSegment
     * @param type defaults to the type of the timeSegment provided as first argument
     * @param offset defaults to 1.
     */
    public decNumSegment(timeSegment: NumSegment, type: number = null, offset: number = 1): void {
        if (!timeSegment) {
            return null;
        }

        type = ((type == null) || (typeof type === "undefined")) ? timeSegment.type : type;
        timeSegment.index = this.decNum(timeSegment.index, type, offset);
    }

    /**
     * ATTENTION : modifie le segment sans copie
     * @param timeSegment
     * @param type defaults to the type of the NumSegment provided as first argument
     * @param offset defaults to 1.
     */
    public incNumSegment(timeSegment: NumSegment, type: number = null, offset: number = 1): void {
        if (!timeSegment) {
            return null;
        }

        type = ((type == null) || (typeof type === "undefined")) ? timeSegment.type : type;
        timeSegment.index = this.incNum(timeSegment.index, type, offset);
    }

    public isEltInSegment(elt: number, segment: NumSegment): boolean {
        if ((elt == null) || (typeof elt == 'undefined') || (!segment)) {
            return false;
        }

        let end: number;

        switch (segment.type) {
            case NumSegment.TYPE_INT:
            default:
                end = segment.index + 1;
        }

        return (elt >= segment.index) && (elt < end);
    }

    /**
     * ATTENTION le num n'est pas modifié mais renvoyé
     */
    public incNum(num: number, segment_type: number, offset: number = 1): number {

        switch (segment_type) {
            case NumSegment.TYPE_INT:
            default:
                return num + offset;
        }
    }

    /**
     * ATTENTION le num n'est pas modifié mais renvoyé
     */
    public decNum(num: number, segment_type: number, offset: number = 1): number {
        return this.incNum(num, segment_type, -offset);
    }

    /**
     *
     * @param start
     * @param end
     * @param num_segment_type
     */
    public getAllDataNumSegments(start: number, end: number, num_segment_type: number, exclude_end: boolean = false): NumSegment[] {

        if ((!start) || (!end) || (num_segment_type == null) || (typeof num_segment_type === 'undefined')) {
            return null;
        }

        let res: NumSegment[] = [];

        let min = start;
        let max = end;
        let step = 1;

        switch (num_segment_type) {
            case NumSegment.TYPE_INT:
            default:
                min = Math.ceil(start);
                max = Math.floor(end);
                step = 1;
        }

        for (let i = min; ((!exclude_end) && (i <= max)) || ((!!exclude_end) && (i < max)); i += step) {
            let numSegment: NumSegment = new NumSegment();
            numSegment.index = i;
            numSegment.type = num_segment_type;
            res.push(numSegment);
        }
        return res;
    }

    // /**
    //  *
    //  * @param NumSegment
    //  * @param type_cumul Type > au Numsegment.type (YEAR si le segment est MONTH par exemple au minimum)
    //  * @returns Corresponding CumulNumSegment
    //  */
    // public getParentNumSegment(numSegment: NumSegment): NumSegment {

    //     let res: NumSegment = new NumSegment();
    //     let num: number = numSegment.num;

    //     switch (numSegment.type) {
    //         case NumSegment.TYPE_INT:
    //         default:
    //             res.type = NumSegment.TYPE_MONTH;
    //             num = date_segment.startOf('month');
    //     }

    //     res.dateIndex = DateHandler.getInstance().formatDayForIndex(date_segment);
    //     return res;
    // }

    // /**
    //  *
    //  * @param NumSegment
    //  * @returns Corresponding CumulNumSegment
    //  */
    // public getCumulNumSegments(NumSegment: NumSegment): NumSegment[] {

    //     if (!NumSegment) {
    //         return null;
    //     }

    //     let res: NumSegment[] = [];
    //     let parentNumSegment: NumSegment = this.getParentNumSegment(NumSegment);

    //     if (!parentNumSegment) {
    //         return null;
    //     }

    //     let start_period = this.getStartNumSegment(parentNumSegment);
    //     let end_period = this.getEndNumSegment(NumSegment);

    //     return this.getAllDataNumSegments(start_period, end_period, NumSegment.type, true);
    // }

    /**
     *
     * @param NumSegment
     * @returns Inclusive lower bound of the NumSegment
     */
    public getStartNumSegment(numSegment: NumSegment): number {
        return numSegment.index;
    }

    /**
     *
     * @param numSegment
     * @returns Exclusive upper bound of the NumSegment
     */
    public getEndNumSegment(numSegment: NumSegment): number {

        if (!numSegment) {
            return null;
        }

        switch (numSegment.type) {
            case NumSegment.TYPE_INT:
            default:
                return numSegment.index + 1;
        }
    }

    // /**
    //  *
    //  * @param NumSegment
    //  * @param type_inclusion choose the granularity of the inclusive bound (day or month)
    //  * @returns Inclusive upper bound of the NumSegment (according to type_inclusion segmentation (last day of month, but not last second...))
    //  */
    // public getInclusiveEndNumSegment(NumSegment: NumSegment, type_inclusion: number = NumSegment.TYPE_INT): number {

    //     if (!NumSegment) {
    //         return null;
    //     }

    //     let res: number = number(NumSegment.dateIndex);

    //     switch (NumSegment.type) {
    //         case NumSegment.TYPE_YEAR:
    //         case NumSegment.TYPE_ROLLING_YEAR_MONTH_START:
    //             res = res.add(1, 'year');
    //             break;
    //         case NumSegment.TYPE_MONTH:
    //             res = res.add(1, 'month');
    //             break;
    //         case NumSegment.TYPE_WEEK:
    //             res = res.add(1, 'week');
    //             break;
    //         case NumSegment.TYPE_INT:
    //         default:
    //             res = res.add(1, 'day');
    //     }

    //     switch (type_inclusion) {
    //         case NumSegment.TYPE_YEAR:
    //         case NumSegment.TYPE_ROLLING_YEAR_MONTH_START:
    //         case NumSegment.TYPE_WEEK:
    //             break;
    //         case NumSegment.TYPE_MONTH:
    //             res = res.add(-1, 'month');
    //             break;
    //         case NumSegment.TYPE_INT:
    //         default:
    //             res = res.add(-1, 'day');
    //     }

    //     return res;
    // }


    public getPreviousNumSegments(NumSegments: NumSegment[], type: number = null, offset: number = 1): NumSegment[] {

        if (!NumSegments) {
            return null;
        }

        let res: NumSegment[] = [];

        for (let i in NumSegments) {
            res.push(this.getPreviousNumSegment(NumSegments[i], type, offset));
        }
        return res;
    }

    /**
     *
     * @param NumSegment
     * @param type defaults to the type of the NumSegment provided as first argument
     * @param offset defaults to 1. Use -1 to get the next segment for example
     * @returns Exclusive upper bound of the NumSegment
     */
    public getPreviousNumSegment(numSegment: NumSegment, type: number = null, offset: number = 1): NumSegment {
        if (!numSegment) {
            return null;
        }

        let res: NumSegment = new NumSegment();
        res.type = numSegment.type;
        type = ((type == null) || (typeof type === "undefined")) ? numSegment.type : type;

        switch (type) {
            case NumSegment.TYPE_INT:
            default:
                res.index = numSegment.index - offset;
        }

        return res;
    }

    public getCorrespondingNumSegments(nums: number[], type: number, offset: number = 0): NumSegment[] {
        let res: NumSegment[] = [];

        for (let i in nums) {
            res.push(this.getCorrespondingNumSegment(nums[i], type, offset));
        }
        return res;
    }

    public getCorrespondingNumSegment(num: number, type: number, offset: number = 0): NumSegment {
        let res: NumSegment = new NumSegment();
        res.type = type;

        switch (type) {
            case NumSegment.TYPE_INT:
            default:
                res.index = Math.floor(num);
        }

        if (offset) {
            res = this.getPreviousNumSegment(res, res.type, -offset);
        }

        return res;
    }

    // public isnumberInNumSegment(date: number, Num_segment: NumSegment): boolean {
    //     if ((!date) || (!Num_segment)) {
    //         return false;
    //     }

    //     let start: number = number(Num_segment.dateIndex);
    //     let end: number;

    //     switch (Num_segment.type) {
    //         case NumSegment.TYPE_YEAR:
    //         case NumSegment.TYPE_ROLLING_YEAR_MONTH_START:
    //             end = number(start).add(1, 'year');
    //             break;
    //         case NumSegment.TYPE_MONTH:
    //             end = number(start).add(1, 'month');
    //             break;
    //         case NumSegment.TYPE_WEEK:
    //             end = number(start).add(1, 'week');
    //             break;
    //         case NumSegment.TYPE_INT:
    //         default:
    //             end = number(start).add(1, 'day');
    //     }

    //     return date.isSameOrAfter(start) && date.isBefore(end);
    // }

    // /**
    //  * @param ts1
    //  * @param ts2
    //  * @param type Par défaut on prend le plus grand ensemble
    //  */
    // public isInSameSegmentType(ts1: NumSegment, ts2: NumSegment, type: number = null): boolean {

    //     if ((!ts1) || (!ts2)) {
    //         return false;
    //     }

    //     if ((type == null) || (typeof type === "undefined")) {
    //         type = Math.min(ts1.type, ts2.type);
    //     }

    //     let start: number = number(ts1.dateIndex);
    //     let end: number;

    //     switch (type) {
    //         case NumSegment.TYPE_YEAR:
    //             start = start.startOf('year');
    //             end = number(start).add(1, 'year');
    //             break;
    //         case NumSegment.TYPE_ROLLING_YEAR_MONTH_START:
    //             start = start.startOf('month');
    //             end = number(start).add(1, 'year');
    //             break;
    //         case NumSegment.TYPE_MONTH:
    //             start = start.startOf('month');
    //             end = number(start).add(1, 'month');
    //             break;
    //         case NumSegment.TYPE_WEEK:
    //             start = start.startOf('isoWeek');
    //             end = number(start).add(1, 'week');
    //             break;
    //         case NumSegment.TYPE_INT:
    //         default:
    //             start = start.startOf('day');
    //             end = number(start).add(1, 'day');
    //     }

    //     let ts2number: number = number(ts2.dateIndex);

    //     return ts2number.isSameOrAfter(start) && ts2number.isBefore(end);
    // }

    // public segmentsAreEquivalent(ts1: NumSegment, ts2: NumSegment): boolean {

    //     if ((!ts1) && ts2) {
    //         return false;
    //     }

    //     if (ts1 && (!ts2)) {
    //         return false;
    //     }

    //     if ((!ts1) && (!ts2)) {
    //         return true;
    //     }

    //     if (ts1.type != ts2.type) {
    //         return false;
    //     }

    //     if (ts1.dateIndex != ts2.dateIndex) {
    //         return false;
    //     }

    //     return true;
    // }

    public get_nums(segments: NumSegment[]): number[] {
        let res: number[] = [];

        for (let i in segments) {
            res.push(segments[i].index);
        }

        return res;
    }

    public get_num_ranges(segments: NumSegment[]): NumRange[] {
        return RangeHandler.getInstance().getRangesUnion(this.get_num_ranges_(segments));
    }

    public get_surrounding_ts_range(segments: NumSegment[]): NumRange {
        return RangeHandler.getInstance().getMinSurroundingRange(this.get_num_ranges_(segments));
    }

    public get_segment_from_range_start(num_range: NumRange, segment_type: number): NumSegment {
        if (!num_range) {
            return null;
        }

        let min = RangeHandler.getInstance().getSegmentedMin(num_range, segment_type);
        return this.getCorrespondingNumSegment(min, segment_type);
    }

    public get_segment_from_range_end(num_range: NumRange, segment_type: number): NumSegment {
        if (!num_range) {
            return null;
        }

        let max = RangeHandler.getInstance().getSegmentedMax(num_range, segment_type);
        return this.getCorrespondingNumSegment(max, segment_type);
    }

    private get_num_ranges_(segments: NumSegment[]): NumRange[] {
        let res: NumRange[] = [];

        for (let i in segments) {
            let range: NumRange = NumRange.createNew(
                NumSegmentHandler.getInstance().getStartNumSegment(segments[i]),
                NumSegmentHandler.getInstance().getEndNumSegment(segments[i]),
                true,
                false,
                segments[i].type);
            res.push(range);
        }

        return res;
    }
}