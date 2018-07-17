import { Express } from 'express';
import ModulesManager from '../../shared/modules/ModulesManager';
import IModuleBase from '../../shared/modules/IModuleBase';
import Module from '../../shared/modules/Module';

export default abstract class ModuleServerBase implements IModuleBase {

    registerApis() {
        throw new Error("Method not implemented.");
    }
    initialize() {
        throw new Error("Method not implemented.");
    }

    public static SERVER_MODULE_ROLE_NAME: string = "SERVER_MODULE_ROLE_NAME";

    constructor(public name: string) {
        ModulesManager.getInstance().registerModule(ModuleServerBase.SERVER_MODULE_ROLE_NAME, this);
    }

    get actif(): boolean {
        return ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) ? ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName).actif : false;
    }

    public registerExpressApis(app: Express): void { }
    public registerCrons(): void { }
    public registerAccessHooks(): void { }
    public registerServerApiHandlers(): void { }
    public async configure(): Promise<void> { }
}