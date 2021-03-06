/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class Patch20191008SupprimerTacheReimport implements IGeneratorWorker {

    public static getInstance(): Patch20191008SupprimerTacheReimport {
        if (!Patch20191008SupprimerTacheReimport.instance) {
            Patch20191008SupprimerTacheReimport.instance = new Patch20191008SupprimerTacheReimport();
        }
        return Patch20191008SupprimerTacheReimport.instance;
    }

    private static instance: Patch20191008SupprimerTacheReimport = null;

    get uid(): string {
        return 'Patch20191008SupprimerTacheReimport';
    }

    private constructor() { }

    /**
     * Objectif : Supprimer le cron de réimport qui est supprimé
     */
    public async work(db: IDatabase<any>) {
        try {
            await this.delete_cron_worker(db, 'ReimportCronWorker');
        } catch (error) {
            ConsoleHandler.getInstance().log('Ignore this error if new project: ' + error);
        }
    }

    private async delete_cron_worker(db: IDatabase<any>, cron_name: string) {
        await db.none("DELETE FROM ref.module_cron_cronworkplan where worker_uid = '" + cron_name + "';");
    }
}