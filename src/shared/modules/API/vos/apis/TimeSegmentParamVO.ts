import TimeSegment from '../../../DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../../tools/TimeSegmentHandler';
import IAPIParamTranslator from '../../interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../interfaces/IAPIParamTranslatorStatic';

export default class TimeSegmentParamVO implements IAPIParamTranslator<TimeSegmentParamVO>{

    public static URL: string = ':date_index/:type';

    public static fromREQ(req): TimeSegmentParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new TimeSegmentParamVO(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(req.params.date_index, parseInt(req.params.type.toString())));
    }

    public static fromParams(timeSegment: TimeSegment): TimeSegmentParamVO {
        return new TimeSegmentParamVO(timeSegment);
    }

    public static getAPIParams(param: TimeSegmentParamVO): any[] {
        return [param.timeSegment];
    }

    public constructor(
        public timeSegment: TimeSegment) {
    }

    public translateToURL(): string {

        return this.timeSegment.dateIndex + '/' + this.timeSegment.type;
    }
}

export const TimeSegmentParamVOStatic: IAPIParamTranslatorStatic<TimeSegmentParamVO> = TimeSegmentParamVO;