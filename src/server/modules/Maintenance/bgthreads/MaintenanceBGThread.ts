import ModuleMaintenance from '../../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../../shared/modules/Maintenance/vos/MaintenanceVO';
import NotificationVO from '../../../../shared/modules/PushData/vos/NotificationVO';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModulePushDataServer from '../../PushData/ModulePushDataServer';
import ModuleMaintenanceServer from '../ModuleMaintenanceServer';
import moment = require('moment');
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';

export default class MaintenanceBGThread implements IBGThread {

    public static getInstance() {
        if (!MaintenanceBGThread.instance) {
            MaintenanceBGThread.instance = new MaintenanceBGThread();
        }
        return MaintenanceBGThread.instance;
    }

    private static instance: MaintenanceBGThread = null;

    private constructor() {
    }

    get name(): string {
        return "MaintenanceBGThread";
    }

    public async work(): Promise<boolean> {

        try {

            // On veut voir si une maintenance est en base et inconnue pour le moment du système
            //  ou si la maintenance que l'on croit devoir préparer est toujours d'actualité
            //  et on informe si c'est pas fait les utilisateurs
            let maintenance: MaintenanceVO = await this.get_planned_maintenance();

            ModuleMaintenanceServer.getInstance().planned_maintenance = maintenance;

            if (!maintenance) {
                return;
            }

            let timeout_minutes_msg1: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);
            let timeout_minutes_msg2: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);
            let timeout_minutes_msg3: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);

            let changed: boolean = false;

            if (!maintenance.broadcasted_msg1) {

                if (moment(maintenance.start_ts).add(-timeout_minutes_msg1, 'minute').isSameOrBefore(moment().utc(true))) {
                    await ModulePushDataServer.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_INFO, ModuleMaintenance.MSG1_code_text);
                    maintenance.broadcasted_msg1 = true;
                    changed = true;
                }
            }

            if (!maintenance.broadcasted_msg2) {

                if (moment(maintenance.start_ts).add(-timeout_minutes_msg2, 'minute').isSameOrBefore(moment().utc(true))) {
                    await ModulePushDataServer.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_WARN, ModuleMaintenance.MSG2_code_text);
                    maintenance.broadcasted_msg2 = true;
                    changed = true;
                }
            }

            if (!maintenance.broadcasted_msg3) {

                if (moment(maintenance.start_ts).add(-timeout_minutes_msg3, 'minute').isSameOrBefore(moment().utc(true))) {
                    await ModulePushDataServer.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_ERROR, ModuleMaintenance.MSG3_code_text);
                    maintenance.broadcasted_msg3 = true;
                    changed = true;
                }
            }

            if (changed) {
                await ModuleDAO.getInstance().insertOrUpdateVO(maintenance);
            }
        } catch (error) {
            console.error(error);
        }

        return false;
    }

    private async get_planned_maintenance(): Promise<MaintenanceVO> {
        let maintenances: MaintenanceVO[] = await ModuleDAO.getInstance().getVos<MaintenanceVO>(MaintenanceVO.API_TYPE_ID);

        for (let i in maintenances) {
            let maintenance = maintenances[i];

            if (!maintenance.maintenance_over) {
                return maintenance;
            }
        }

        return null;
    }
}