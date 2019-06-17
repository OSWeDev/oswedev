import * as moment from 'moment';
import { Moment } from 'moment';

export default class DateHandler {
    public static DAY_FOR_INDEX_FORMAT: string = 'YYYY-MM-DD';
    public static DateTime_FOR_BDD_FORMAT: string = 'YYYY-MM-DD HH:mm:ss';
    public static DateTime_FOR_API_FORMAT: string = 'x';

    public static getInstance(): DateHandler {
        if (!DateHandler.instance) {
            DateHandler.instance = new DateHandler();
        }
        return DateHandler.instance;
    }

    private static instance: DateHandler = null;

    private constructor() {
    }

    public formatDateTimeForAPI(date: Moment): string {
        if ((date == null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format(DateHandler.DateTime_FOR_API_FORMAT);
    }

    public formatDateTimeForBDD(date: Moment): string {
        if ((date == null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format(DateHandler.DateTime_FOR_BDD_FORMAT);
    }

    public humanizeDurationTo(date: Moment): string {
        if (!date) {
            return "";
        }
        return moment.duration(date.diff(moment())).humanize();
    }

    public formatDayForIndex(date: Moment): string {
        if ((date == null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format(DateHandler.DAY_FOR_INDEX_FORMAT);
    }

    public formatDayForVO(date: Moment): string {
        if ((date == null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format('YYYY-MM-DD');
    }

    public formatMonthFromVO(date: Moment): string {
        return date.format('YYYY-MM');
    }

    public formatDayForApi(date: Moment): string {
        if ((date == null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format('YYYY-MM-DD');
    }

    public getDateFromApiDay(day: string): Moment {
        if ((day == null) || (typeof day == 'undefined')) {
            return null;
        }
        return moment(day);
    }

    public formatDayForSQL(date: Moment): string {
        if ((date == null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format('YYYY-MM-DD');
    }

    public getDateFromSQLDay(day: string): Moment {
        if ((day == null) || (typeof day == 'undefined')) {
            return null;
        }
        return moment(day);
    }
}