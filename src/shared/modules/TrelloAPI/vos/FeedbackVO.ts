import { Moment } from 'moment';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class FeedbackVO implements IVersionedVO {
    public static API_TYPE_ID: string = "feedback";

    public static FEEDBACK_TYPE_LABELS: string[] = ['feedback.FEEDBACK_TYPE.ENHANCEMENT_REQUEST', 'feedback.FEEDBACK_TYPE.BUG', 'feedback.FEEDBACK_TYPE.INCIDENT', 'feedback.FEEDBACK_TYPE.NOT_SET'];
    public static FEEDBACK_TYPE_ENHANCEMENT_REQUEST: number = 0;
    public static FEEDBACK_TYPE_BUG: number = 1;
    public static FEEDBACK_TYPE_INCIDENT: number = 2;
    public static FEEDBACK_TYPE_NOT_SET: number = 3;

    public id: number;
    public _type: string = FeedbackVO.API_TYPE_ID;

    public name: string;
    public email: string;
    public phone: string;
    public message: string;

    public user_id: number;
    public is_impersonated: boolean;
    public impersonated_from_user_id: number;

    public trello_ref: string;

    // When user opened the feedback window to start a feedback
    public feedback_start_date: Moment;
    // When user sent the feedback
    public feedback_end_date: Moment;

    // User connection date (according to the last load => server session)
    public user_connection_date: Moment;
    // User connection date (according to the last load => server session)
    public impersonated_from_user_connection_date: Moment;
    // User login date (according to the last login => server session)
    public user_login_date: Moment;
    // User login date (according to the last login => server session)
    public impersonated_from_user_login_date: Moment;

    public feedback_type: number;

    public screen_capture_1_id: number;
    public screen_capture_2_id: number;
    public screen_capture_3_id: number;

    public file_attachment_1_id: number;
    public file_attachment_2_id: number;
    public file_attachment_3_id: number;

    // URL (with Query) when the user opened the feedback tool
    public feedback_start_url: string;
    // URL (with Query) when the user sent the feedback
    public feedback_end_url: string;

    // VueJS routes, in JSON
    public routes_json: string;

    // Every api requests, formatted as LightWeightSendableRequestVO, and in json
    public apis_log_json: string;

    // Every console_logs we could get
    public console_logs: string[];

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: Moment;
    public version_edit_author_id: number;
    public version_edit_timestamp: Moment;
}