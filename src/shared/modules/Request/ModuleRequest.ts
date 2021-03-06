import ObjectHandler from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import SendRequestParamVO, { SendRequestParamVOStatic } from './vos/SendRequestParamVO';

export default class ModuleRequest extends Module {

    public static MODULE_NAME: string = 'Request';

    public static METHOD_GET: string = "GET";
    public static METHOD_POST: string = "POST";
    public static METHOD_DELETE: string = "DELETE";

    public static APINAME_sendRequestFromApp = "send_request_from_app";

    public static getInstance(): ModuleRequest {
        if (!ModuleRequest.instance) {
            ModuleRequest.instance = new ModuleRequest();
        }
        return ModuleRequest.instance;
    }

    private static instance: ModuleRequest = null;

    public sendRequestFromApp: (
        method: string,
        host: string,
        path: string,
        posts: {},
        headers: {},
        sendHttps: boolean,
        result_headers?: {}
    ) => Promise<any> = APIControllerWrapper.sah(ModuleRequest.APINAME_sendRequestFromApp);

    private constructor() {

        super("request", ModuleRequest.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public registerApis() {

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<SendRequestParamVO, any>(
            null,
            ModuleRequest.APINAME_sendRequestFromApp,
            [],
            SendRequestParamVOStatic
        ));
    }

    public get_params_url(params: { [i: string]: string }) {
        let res: string = null;

        if ((!params) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(params))) {
            return "";
        }

        for (let i in params) {
            let param = params[i];

            res = (res ? res + "&" : "?") + i + "=" + param;
        }

        return res;
    }
}