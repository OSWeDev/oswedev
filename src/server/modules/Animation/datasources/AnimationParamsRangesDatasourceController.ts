import ModuleAnimation from "../../../../shared/modules/Animation/ModuleAnimation";
import ThemeModuleDataRangesVO from "../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import AnimationParametersVO from "../../../../shared/modules/Animation/vos/AnimationParametersVO";
import DataSourceControllerSimpleCacheBase from "../../Var/datasource/DataSourceControllerSimpleCacheBase";


export default class AnimationParamsRangesDatasourceController extends DataSourceControllerSimpleCacheBase {

    public static getInstance(): AnimationParamsRangesDatasourceController {
        if (!AnimationParamsRangesDatasourceController.instance) {
            AnimationParamsRangesDatasourceController.instance = new AnimationParamsRangesDatasourceController(
                'AnimationParamsRangesDatasourceController',
                [AnimationParametersVO.API_TYPE_ID],
                { fr: 'Paramètres animation' });
        }
        return AnimationParamsRangesDatasourceController.instance;
    }

    protected static instance: AnimationParamsRangesDatasourceController = null;

    public async get_data(param: ThemeModuleDataRangesVO, ds_cache): Promise<AnimationParametersVO> {
        return await ModuleAnimation.getInstance().getParameters();
    }
}