import * as moment from 'moment';
import { Moment } from 'moment';
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';


export default class PasswordInvalidationController {

    public static getInstance() {
        if (!PasswordInvalidationController.instance) {
            PasswordInvalidationController.instance = new PasswordInvalidationController();
        }
        return PasswordInvalidationController.instance;
    }

    private static instance: PasswordInvalidationController = null;

    private constructor() {
    }

    public get_users_to_remind_and_invalidate(
        users: UserVO[],
        reminder1_days: number,
        reminder2_days: number,
        invalid_days: number,
        users_to_remind_1: UserVO[],
        users_to_remind_2: UserVO[],
        users_to_invalidate: UserVO[]): void {

        for (let i in users) {
            let user: UserVO = users[i];

            if (user.blocked) {
                continue;
            }

            if (user.invalidated) {
                continue;
            }

            let date_modif_pass: Moment = moment(user.password_change_date).utc(true);

            /**
             * Si la date de modif est dans le futur, on ignore
             */
            if (date_modif_pass.isSameOrAfter(moment().utc(true))) {
                continue;
            }

            // combien de jours depuis date de changement de mdp ?
            let nb_days: number = - moment(date_modif_pass).utc(true).diff(moment().utc(true)) / 1000 / 60 / 60 / 24; // Result of diff should be negativ

            let expiration_date: Moment = moment(date_modif_pass).utc(true).add(invalid_days, 'days');
            let nb_days_to_invalidation: number = invalid_days - nb_days;

            // Le cas de l'invalidation
            // cas où la date de changement de mdp est passée de plus de PARAM_NAME_PWD_INVALIDATION_DAYS jours
            if (moment().utc(true).isSameOrAfter(expiration_date)) {
                users_to_invalidate.push(user);
                continue;
            }


            // Second rappel
            // cas où on est à moins de PARAM_NAME_REMINDER_PWD2_DAYS jours de la date de changement de mdp
            if ((!user.reminded_pwd_2) && (nb_days_to_invalidation <= reminder2_days)) {
                users_to_remind_2.push(user);
                continue;
            }

            // Premier rappel
            // cas où on est à moins de PARAM_NAME_REMINDER_PWD1_DAYS jours de la date de changement de mdp
            if ((!user.reminded_pwd_1) && (nb_days_to_invalidation <= reminder1_days)) {
                users_to_remind_1.push(user);
                continue;
            }

        }
    }
}