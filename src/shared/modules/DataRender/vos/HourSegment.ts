import { Duration } from 'moment';
import ISegment from '../interfaces/ISegment';

export default class HourSegment implements ISegment<Duration> {
    public static TYPE_NAMES: string[] = [
        "HourSegment.hour.type_name",
        "HourSegment.minute.type_name",
        "HourSegment.second.type_name",
        "HourSegment.ms.type_name",
    ];
    public static TYPE_HOUR: number = 0;
    public static TYPE_MINUTE: number = 1;
    public static TYPE_SECOND: number = 2;
    public static TYPE_MS: number = 3;
    public static TYPE_NAMES_ENUM: { [type: number]: string } = {
        [HourSegment.TYPE_HOUR]: HourSegment.TYPE_NAMES[HourSegment.TYPE_HOUR],
        [HourSegment.TYPE_MINUTE]: HourSegment.TYPE_NAMES[HourSegment.TYPE_MINUTE],
        [HourSegment.TYPE_SECOND]: HourSegment.TYPE_NAMES[HourSegment.TYPE_SECOND],
        [HourSegment.TYPE_MS]: HourSegment.TYPE_NAMES[HourSegment.TYPE_MS],
    };

    /**
     * DON'T USE this method to create HourSegments, use only the HourSegmentHandler to get corresponding segment from Duration and segment_type
     */
    public static createNew(date: Duration, type: number): HourSegment {
        return new HourSegment(date, type);
    }

    private constructor(public index: Duration, public type: number) { }
}