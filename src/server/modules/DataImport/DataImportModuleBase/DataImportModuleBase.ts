import IImportedData from '../../../../shared/modules/DataImport/interfaces/IImportedData';
import IPostTraitementModule from '../../../../shared/modules/DataImport/interfaces/IPostTraitementModule';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import IModuleBase from '../../../../shared/modules/IModuleBase';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import ModuleServerBase from '../../ModuleServerBase';

export default abstract class DataImportModuleBase extends ModuleServerBase implements IPostTraitementModule, IModuleBase {

    public static DataImportRoleName: string = "DataImportRoleName";

    protected constructor(public name: string) {
        super(name);
        this.name = name;
        ModulesManager.getInstance().registerModule(DataImportModuleBase.DataImportRoleName, this);
    }

    public registerApis() { }
    public initialize() { }

    public abstract hook_merge_imported_datas_in_database(datas: IImportedData[], historic: DataImportHistoricVO): Promise<boolean>;
    public abstract async hook_configure_import();

    // Méthode qui doit renvoyer la liste des api_types_ids qui sont concernés par ce post-traitement d'import. 
    //  Permet d'informer immédiatement d'un changement de données au niveau client
    public abstract get_merged_api_type_ids(): string[];
}