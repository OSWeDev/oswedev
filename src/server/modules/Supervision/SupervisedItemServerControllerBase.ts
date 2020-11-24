import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ISupervisedItem from '../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ISupervisedItemServerController from './interfaces/ISupervisedItemServerController';
import SupervisionServerController from './SupervisionServerController';

export default abstract class SupervisedItemServerControllerBase<T extends ISupervisedItem> implements ISupervisedItemServerController<T> {

    protected constructor(public api_type_id: string) {
        SupervisionServerController.getInstance().registerServerController(api_type_id, this);
    }

    public abstract get_execute_time_ms(): number;

    public async work_all(): Promise<boolean> {

        try {

            let supervised_pdvs: T[] = await ModuleDAO.getInstance().getVos<T>(this.api_type_id);

            for (let i in supervised_pdvs) {
                let supervised_pdv = supervised_pdvs[i];

                await this.work_one(supervised_pdv);
            }
        } catch (e) {
            ConsoleHandler.getInstance().error(e);
        }

        return true;
    }

    public async work_invalid(): Promise<boolean> {
        try {

            let supervised_pdvs: T[] = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<T>(
                this.api_type_id,
                null,
                null,
                'invalid',
                ['true']);

            for (let i in supervised_pdvs) {
                let supervised_pdv = supervised_pdvs[i];

                await this.work_one(supervised_pdv);
            }
        } catch (e) {
            ConsoleHandler.getInstance().error(e);
        }

        return true;
    }

    public abstract work_one(item: T, ...args): Promise<boolean>;
}