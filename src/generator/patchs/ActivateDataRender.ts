import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../IGeneratorWorker';

export default class ActivateDataRender implements IGeneratorWorker {

    public static getInstance(): ActivateDataRender {
        if (!ActivateDataRender.instance) {
            ActivateDataRender.instance = new ActivateDataRender();
        }
        return ActivateDataRender.instance;
    }

    private static instance: ActivateDataRender = null;

    get uid(): string {
        return 'ActivateDataRender';
    }

    private constructor() { }

    /**
     * Objectif : Forcer le module render actif pour les anciens projets
     */
    public async work(db: IDatabase<any>) {
        await db.none("update admin.modules set actif = true where name = 'data_render';");
    }
}