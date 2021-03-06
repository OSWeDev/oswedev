/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import DAOUpdateVOHolder from '../../../server/modules/DAO/vos/DAOUpdateVOHolder';
import VarCtrlDAGNode from '../../../server/modules/Var/controllerdag/VarCtrlDAGNode';
import VarsDatasVoUpdateHandler from '../../../server/modules/Var/VarsDatasVoUpdateHandler';
import VarServerControllerBase from '../../../server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDepsDataHandler from './fakes/FakeDepsDataHandler';
import FakeDistantHandler from './fakes/FakeDistantHandler';
import FakeEmpDayDataHandler from './fakes/FakeEmpDayDataHandler';
import FakeEmpDistantHandler from './fakes/FakeEmpDistantHandler';
import FakeVarControllerDeps from './fakes/FakeVarControllerDeps';
import FakeVarControllerDsDistant from './fakes/FakeVarControllerDsDistant';
import FakeVarControllerDsEmpDistant from './fakes/FakeVarControllerDsEmpDistant';
import FakeDataVO from './fakes/vos/FakeDataVO';
import VarsDatasProxy from '../../../server/modules/Var/VarsDatasProxy';

describe('VarsDatasVoUpdateHandler', () => {

    it('test filter_var_datas_by_indexes', async () => {
        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();
        await FakeVarControllerDsDistant.getInstance().initialize();
        await FakeVarControllerDsEmpDistant.getInstance().initialize();
        await FakeVarControllerDeps.getInstance().initialize();
        await VarsController.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.name]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.name]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.name]: FakeVarControllerDeps.getInstance().varConf
        });
        VarsServerController.getInstance().init_varcontrollers_dag();

        let vo_types: string[] = [];
        let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};
        let intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};
        let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = {};
        let markers: { [var_id: number]: number } = {};

        let var_datas: VarDataBaseVO[] = [];
        let prepend: boolean = true;
        let donot_insert_if_absent: boolean = true;
        let just_been_loaded_from_db: boolean = true;

        await VarsDatasProxy.getInstance()['filter_var_datas_by_indexes'](var_datas, prepend, donot_insert_if_absent, just_been_loaded_from_db);
    });
});