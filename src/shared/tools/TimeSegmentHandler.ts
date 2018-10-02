import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import { Moment } from 'moment';
import * as moment from 'moment';
import DateHandler from './DateHandler';

export default class TimeSegmentHandler {
    public static getInstance(): TimeSegmentHandler {
        if (!TimeSegmentHandler.instance) {
            TimeSegmentHandler.instance = new TimeSegmentHandler();
        }
        return TimeSegmentHandler.instance;
    }

    private static instance: TimeSegmentHandler = null;

    private constructor() { }

    /**
     *
     * @param start
     * @param end
     * @param time_segment_type
     */
    public getAllDataTimeSegments(start: Moment, end: Moment, time_segment_type: number, exclude_end: boolean = false): TimeSegment[] {
        let res: TimeSegment[] = [];
        let date: Moment = moment(start);
        let stop_at: Moment = moment(end);

        switch (time_segment_type) {
            case TimeSegment.TYPE_YEAR:
                date = start.startOf('year');
                stop_at = end.startOf('year');
                break;
            case TimeSegment.TYPE_MONTH:
                date = start.startOf('month');
                stop_at = end.startOf('month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                date = start.startOf('day');
                stop_at = end.startOf('day');
        }

        while (((!exclude_end) && date.isSameOrBefore(stop_at)) || (exclude_end && date.isBefore(stop_at))) {

            let timeSegment: TimeSegment = new TimeSegment();
            timeSegment.dateIndex = DateHandler.getInstance().formatDayForIndex(date);
            timeSegment.type = time_segment_type;
            res.push(timeSegment);

            switch (time_segment_type) {
                case TimeSegment.TYPE_YEAR:
                    date = date.add(1, 'year');
                    break;
                case TimeSegment.TYPE_MONTH:
                    date = date.add(1, 'month');
                    break;
                case TimeSegment.TYPE_DAY:
                default:
                    date = date.add(1, 'day');
            }
        }

        return res;
    }

    /**
     *
     * @param timeSegment
     * @param type_cumul Type > au timesegment.type (YEAR si le segment est MONTH par exemple au minimum)
     * @returns Corresponding CumulTimeSegment
     */
    public getParentTimeSegment(timeSegment: TimeSegment): TimeSegment {
        let res: TimeSegment = new TimeSegment();
        let date_segment: Moment = moment(timeSegment.dateIndex);

        switch (timeSegment.type) {
            case TimeSegment.TYPE_YEAR:
                // Impossible de gérer ce cas;
                return null;
            case TimeSegment.TYPE_MONTH:
                res.type = TimeSegment.TYPE_YEAR;
                date_segment = date_segment.startOf('year');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res.type = TimeSegment.TYPE_MONTH;
                date_segment = date_segment.startOf('month');
        }

        res.dateIndex = DateHandler.getInstance().formatDayForIndex(date_segment);
        return res;
    }

    /**
     *
     * @param timeSegment
     * @returns Corresponding CumulTimeSegment
     */
    public getCumulTimeSegments(timeSegment: TimeSegment): TimeSegment[] {
        let res: TimeSegment[] = [];
        let parentTimeSegment: TimeSegment = this.getParentTimeSegment(timeSegment);

        let start_period = this.getStartTimeSegment(parentTimeSegment);
        let end_period = this.getEndTimeSegment(timeSegment);

        return this.getAllDataTimeSegments(start_period, end_period, timeSegment.type, true);
    }

    /**
     *
     * @param timeSegment
     * @returns Inclusive lower bound of the timeSegment
     */
    public getStartTimeSegment(timeSegment: TimeSegment): Moment {
        return moment(timeSegment.dateIndex);
    }

    /**
     *
     * @param timeSegment
     * @returns Exclusive upper bound of the timeSegment
     */
    public getEndTimeSegment(timeSegment: TimeSegment): Moment {
        let res: Moment = moment(timeSegment.dateIndex);

        switch (timeSegment.type) {
            case TimeSegment.TYPE_YEAR:
                res = res.add(1, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                res = res.add(1, 'month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res = res.add(1, 'day');
        }

        return res;
    }

    public getPreviousTimeSegments(timeSegments: TimeSegment[], type: number = null, offset: number = 1): TimeSegment[] {
        let res: TimeSegment[] = [];

        for (let i in timeSegments) {
            res.push(this.getPreviousTimeSegment(timeSegments[i], type, offset));
        }
        return res;
    }

    /**
     * @param monthSegment TimeSegment de type month (sinon renvoie null)
     * @param date Numéro du jour dans le mois [1,31]
     * @returns Le moment correspondant
     */
    public getDateInMonthSegment(monthSegment: TimeSegment, date: number): Moment {

        if (monthSegment.type != TimeSegment.TYPE_MONTH) {
            return null;
        }

        // La dateIndex d'un segment mois est le premier jour du mois.
        let res: Moment = moment(monthSegment.dateIndex);
        res.date(date);
        return res;
    }

    /**
     *
     * @param timeSegment
     * @param type defaults to the type of the timeSegment provided as first argument
     * @param offset defaults to 1. Use -1 to get the next segment for example
     * @returns Exclusive upper bound of the timeSegment
     */
    public getPreviousTimeSegment(timeSegment: TimeSegment, type: number = null, offset: number = 1): TimeSegment {
        let res: TimeSegment = new TimeSegment();
        res.type = timeSegment.type;
        let date_segment: Moment = moment(timeSegment.dateIndex);
        type = type ? type : timeSegment.type;

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                date_segment = date_segment.add(-offset, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                date_segment = date_segment.add(-offset, 'month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                date_segment = date_segment.add(-offset, 'day');
        }

        res.dateIndex = DateHandler.getInstance().formatDayForIndex(date_segment);
        return res;
    }

    public getCorrespondingTimeSegment(date: Moment, type: number, offset: number = 0): TimeSegment {
        let res: TimeSegment = new TimeSegment();
        res.type = type;
        let date_segment: Moment = moment(date);

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                date_segment = date_segment.startOf('year');
                break;
            case TimeSegment.TYPE_MONTH:
                date_segment = date_segment.startOf('month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                date_segment = date_segment.startOf('day');
        }

        res.dateIndex = DateHandler.getInstance().formatDayForIndex(date_segment);

        if (offset) {
            res = this.getPreviousTimeSegment(res, res.type, -offset);
        }

        return res;
    }

    public isMomentInTimeSegment(date: Moment, time_segment: TimeSegment): boolean {
        let start: Moment = moment(time_segment.dateIndex);
        let end: Moment;

        switch (time_segment.type) {
            case TimeSegment.TYPE_YEAR:
                end = moment(start).add(1, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                end = moment(start).add(1, 'month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                end = moment(start).add(1, 'day');
        }

        return date.isSameOrAfter(start) && date.isBefore(end);
    }

    public isInSameSegmentType(ts1: TimeSegment, ts2: TimeSegment, type: number = TimeSegment.TYPE_YEAR): boolean {
        let start: Moment = moment(ts1.dateIndex);
        let end: Moment;

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                start = start.startOf('year');
                end = moment(start).add(1, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                start = start.startOf('month');
                end = moment(start).add(1, 'month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                start = start.startOf('day');
                end = moment(start).add(1, 'day');
        }

        let ts2Moment: Moment = moment(ts2.dateIndex);

        return ts2Moment.isSameOrAfter(start) && ts2Moment.isBefore(end);
    }
}