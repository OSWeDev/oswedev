import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import FeedbackVO from '../../../../shared/modules/Feedback/vos/FeedbackVO';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import ServerBase from '../../../ServerBase';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import FeedbackConfirmationMail_html_template from './FeedbackConfirmationMail_html_template.html';


export default class FeedbackConfirmationMail {

    public static CODE_TEXT_MAIL_SUBJECT_FeedbackConfirmationMail: string = 'mails.feedback.confirmation.subject';

    public static getInstance() {
        if (!FeedbackConfirmationMail.instance) {
            FeedbackConfirmationMail.instance = new FeedbackConfirmationMail();
        }
        return FeedbackConfirmationMail.instance;
    }

    private static instance: FeedbackConfirmationMail = null;

    private constructor() {
    }

    public async sendConfirmationEmail(feedback: FeedbackVO): Promise<void> {

        // On doit se comporter comme un server à ce stade
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        httpContext.set('IS_CLIENT', false);

        // Si on est en impersonate, on envoie pas le mail au compte client mais au compte admin
        let user = null;
        if (feedback.is_impersonated) {
            user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, feedback.impersonated_from_user_id);
        } else {
            user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, feedback.user_id);
        }

        // Send mail
        let translatable_mail_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(FeedbackConfirmationMail.CODE_TEXT_MAIL_SUBJECT_FeedbackConfirmationMail);
        let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_subject.id);
        await ModuleMailerServer.getInstance().sendMail({
            to: user.email,
            subject: translated_mail_subject.translated,
            html: await ModuleMailerServer.getInstance().prepareHTML(FeedbackConfirmationMail_html_template, user.lang_id, {
                FEEDBACK_ID: feedback.id.toString()
            })
        });
    }
}