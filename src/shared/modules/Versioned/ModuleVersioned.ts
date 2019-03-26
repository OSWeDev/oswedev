import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import IVersionedVO from './interfaces/IVersionedVO';

export default class ModuleVersioned extends Module {

    public static MODULE_NAME: string = 'Versioned';

    public static APINAME_RESTORE_TRASHED_VO: string = "RESTORE_TRASHED_VO";

    public static getInstance(): ModuleVersioned {
        if (!ModuleVersioned.instance) {
            ModuleVersioned.instance = new ModuleVersioned();
        }
        return ModuleVersioned.instance;
    }

    private static instance: ModuleVersioned = null;

    private constructor() {

        super("versioned", ModuleVersioned.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IVersionedVO, boolean>(
            ModuleVersioned.APINAME_RESTORE_TRASHED_VO,
            (param: IVersionedVO) => [param._type]
        ));
    }

    public async restoreTrashedVo(vo: IVersionedVO): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<IVersionedVO, boolean>(ModuleVersioned.APINAME_RESTORE_TRASHED_VO, vo);
    }
}