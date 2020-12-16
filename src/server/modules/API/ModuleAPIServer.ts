import { Express, Request, Response } from 'express';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../../../shared/modules/API/APIController';
import IAPIParamTranslator from '../../../shared/modules/API/interfaces/IAPIParamTranslator';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IServerUserSession from '../../IServerUserSession';
import ServerBase from '../../ServerBase';
import ServerExpressController from '../../ServerExpressController';
import StackContext from '../../StackContext';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleAPIServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAPIServer.instance) {
            ModuleAPIServer.instance = new ModuleAPIServer();
        }
        return ModuleAPIServer.instance;
    }

    private static instance: ModuleAPIServer = null;

    private constructor() {
        super(ModuleAPI.getInstance().name);
    }

    public registerExpressApis(app: Express): void {

        // On doit register toutes les APIs
        for (let i in ModuleAPI.getInstance().registered_apis) {
            let api: APIDefinition<any, any> = ModuleAPI.getInstance().registered_apis[i];

            switch (api.api_type) {
                case APIDefinition.API_TYPE_GET:
                    ConsoleHandler.getInstance().log("AJOUT API GET  :" + APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase());
                    app.get(APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    break;
                case APIDefinition.API_TYPE_POST:
                    ConsoleHandler.getInstance().log("AJOUT API POST :" + APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase());
                    app.post(APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    break;
                case APIDefinition.API_TYPE_POST_FOR_GET:
                    ConsoleHandler.getInstance().log("AJOUT API POST FOR GET :" + APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase());
                    app.post(APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    break;
            }
        }
    }

    private createApiRequestHandler<T, U>(api: APIDefinition<T, U>): (req: Request, res: Response) => void {
        return async (req: Request, res: Response) => {

            if (!!api.access_policy_name) {
                if (!ModuleAccessPolicy.getInstance().checkAccess(api.access_policy_name)) {
                    ConsoleHandler.getInstance().error('Access denied to API:' + api.api_name + ':');
                    this.respond_on_error(api, res);
                    return;
                }
            }

            let param: IAPIParamTranslator<T> = null;
            if (api.param_translator && api.param_translator.fromREQ) {
                try {
                    param = api.param_translator.fromREQ(req);
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    this.respond_on_error(api, res);
                    return;
                }
            } else {
                if (((api.api_type == APIDefinition.API_TYPE_POST) && (req.body)) ||
                    ((api.api_type == APIDefinition.API_TYPE_POST_FOR_GET) && (req.body))) {
                    param = APIControllerWrapper.getInstance().try_translate_vo_from_api(req.body);
                }
            }

            let returnvalue = null;
            try {
                returnvalue = await StackContext.getInstance().runPromise(
                    ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
                    async () => await api.SERVER_HANDLER(param));
            } catch (error) {
                ConsoleHandler.getInstance().error(error);
                this.respond_on_error(api, res);
                return;
            }


            switch (api.api_return_type) {
                case APIDefinition.API_RETURN_TYPE_JSON:
                    if (typeof returnvalue == 'undefined') {
                        returnvalue = {} as any;
                    }
                case APIDefinition.API_RETURN_TYPE_FILE:
                    returnvalue = APIControllerWrapper.getInstance().try_translate_vo_to_api(returnvalue);
                    res.json(returnvalue);
                    return;

                case APIDefinition.API_RETURN_TYPE_RES:
                default:
                    res.end(returnvalue);
                    return;
            }
        };
    }

    private respond_on_error<T, U>(api: APIDefinition<T, U>, res: Response) {
        switch (api.api_return_type) {
            case APIDefinition.API_RETURN_TYPE_JSON:
            case APIDefinition.API_RETURN_TYPE_FILE:
                res.json(null);
                return;
            case APIDefinition.API_RETURN_TYPE_RES:
            default:
                res.end(null);
                return;
        }
    }
}