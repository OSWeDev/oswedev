import IPostTraitementModule from '../../../../shared/modules/DataImport/interfaces/IPostTraitementModule';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import IModuleBase from '../../../../shared/modules/IModuleBase';
import IImportData from '../../../../shared/modules/DataImport/interfaces/IImportData';
import IImportOptions from '../../../../shared/modules/DataImport/interfaces/IImportOptions';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import Module from '../../../../shared/modules/Module';

export default abstract class DataImportModuleBase implements IPostTraitementModule, IModuleBase {

    public static DataImportRoleName: string = "DataImportRoleName";

    protected constructor(public name: string) {

        this.name = name;
        ModulesManager.getInstance().registerModule(DataImportModuleBase.DataImportRoleName, this);
    }

    An_accessor_cannot_be_declared_in_an_ambient_context_1086

    public registerApis() { }
    public initialize() { }

    public abstract hook_merge_imported_datas_in_database(datas: IImportData[], import_target_date_index: string, historic: DataImportHistoricVO, options: IImportOptions): Promise<boolean>;
    public abstract async hook_configure_import();

    get actif(): boolean {
        return (ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) as Module).actif;
    }
}