/* istanbul ignore file: really difficult tests : not willing to test this part. Maybe divide this in smaller chunks, but I don't see any usefull test */

import * as pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import ConfigurationService from '../server/env/ConfigurationService';
import EnvParam from '../server/env/EnvParam';
import FileLoggerHandler from '../server/FileLoggerHandler';
import ModulesClientInitializationDatasGenerator from '../server/modules/ModulesClientInitializationDatasGenerator';
import ModuleServiceBase from '../server/modules/ModuleServiceBase';
import ModuleSASSSkinConfiguratorServer from '../server/modules/SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';
import DefaultTranslationsServerManager from '../server/modules/Translation/DefaultTranslationsServerManager';
import ModulesManager from '../shared/modules/ModulesManager';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import IGeneratorWorker from './IGeneratorWorker';
import Patch20191010CreateDefaultAdminAccountIfNone from './patchs/postmodules/Patch20191010CreateDefaultAdminAccountIfNone';
import Patch20191010CreateDefaultLangFRIfNone from './patchs/postmodules/Patch20191010CreateDefaultLangFRIfNone';
import Patch20191018CHECKEnvParamsForMDPRecovery from './patchs/postmodules/Patch20191018CHECKEnvParamsForMDPRecovery';
import Patch20191106ForceAccessDefaultToVisionFCPP from './patchs/postmodules/Patch20191106ForceAccessDefaultToVisionFCPP';
import Patch20191112AddPwdCryptTrigger from './patchs/postmodules/Patch20191112AddPwdCryptTrigger';
import Patch20191126CreateDefaultRobotUserAccount from './patchs/postmodules/Patch20191126CreateDefaultRobotUserAccount';
import Patch20200131InitUserLogPolicies from './patchs/postmodules/Patch20200131InitUserLogPolicies';
import Patch20200312ChangeResetPWDMailContent from './patchs/postmodules/Patch20200312ChangeResetPWDMailContent';
import Patch20200325PresetExistingLangsChangeRights from './patchs/postmodules/Patch20200325PresetExistingLangsChangeRights';
import Patch20200731MailParamsInit from './patchs/postmodules/Patch20200731MailParamsInit';
import Patch20200806InitBaseImageFormats from './patchs/postmodules/Patch20200806InitBaseImageFormats';
import Patch20200914InitTeamsWebhookForDailyReports from './patchs/postmodules/Patch20200914InitTeamsWebhookForDailyReports';
import Patch20200924UpgradeUserVOPost from './patchs/postmodules/Patch20200924UpgradeUserVOPost';
import Patch20200926InitPoliciesINSERTORUPDATEUserLogs from './patchs/postmodules/Patch20200926InitPoliciesINSERTORUPDATEUserLogs';
import Patch20201001InitPoliciesFeedback from './patchs/postmodules/Patch20201001InitPoliciesFeedback';
import Patch20201006InitFrontVarsPolicies from './patchs/postmodules/Patch20201006InitFrontVarsPolicies';
import Patch20201125InitVarsBDDIndexes from './patchs/postmodules/Patch20201125InitVarsBDDIndexes';
import Patch20201214InitFrontVarsPolicies2 from './patchs/postmodules/Patch20201214InitFrontVarsPolicies2';
import Patch20201218AddMaintenanceCreationPolicy from './patchs/postmodules/Patch20201218AddMaintenanceCreationPolicy';
import Patch20210107InitLoggedOnce from './patchs/postmodules/Patch20210107InitLoggedOnce';
import Patch20210202AnimationPrctReussite from './patchs/postmodules/Patch20210202AnimationPrctReussite';
import Patch20210225AjoutDateCreationCompteUtilisateur from './patchs/postmodules/Patch20210225AjoutDateCreationCompteUtilisateur';
import ActivateDataImport from './patchs/premodules/ActivateDataImport';
import ActivateDataRender from './patchs/premodules/ActivateDataRender';
import ChangeCronDateHeurePlanifiee from './patchs/premodules/ChangeCronDateHeurePlanifiee';
import ChangeTypeDatesNotificationVO from './patchs/premodules/ChangeTypeDatesNotificationVO';
import Patch20191008ChangeDIHDateType from './patchs/premodules/Patch20191008ChangeDIHDateType';
import Patch20191008ChangeDILDateType from './patchs/premodules/Patch20191008ChangeDILDateType';
import Patch20191008SupprimerTacheReimport from './patchs/premodules/Patch20191008SupprimerTacheReimport';
import Patch20191010CheckBasicSchemas from './patchs/premodules/Patch20191010CheckBasicSchemas';
import Patch20191112CheckExtensions from './patchs/premodules/Patch20191112CheckExtensions';
import Patch20200131DeleteVersioningVOAccessPolicies from './patchs/premodules/Patch20200131DeleteVersioningVOAccessPolicies';
import Patch20200331DeleteOrphanTranslations from './patchs/premodules/Patch20200331DeleteOrphanTranslations';
import Patch20200924UpgradeUserVO from './patchs/premodules/Patch20200924UpgradeUserVO';
import Patch20201123UpdateVarCacheConfVO from './patchs/premodules/Patch20201123UpdateVarCacheConfVO';
import VendorBuilder from './vendor_builder/VendorBuilder';
import Patch20210305affichageIconePDF from './patchs/postmodules/Patch20210305affichageIconePDF';
import Patch20210608TrimUserVO from './patchs/premodules/Patch20210608TrimUserVO';
import Patch20210615ChangeLoginTrads from './patchs/postmodules/Patch20210615ChangeLoginTrads';
import Patch20210615ChangeRecoverySMS from './patchs/postmodules/Patch20210615ChangeRecoverySMS';

export default abstract class GeneratorBase {

    public static getInstance(): GeneratorBase {
        return GeneratorBase.instance;
    }

    protected static instance: GeneratorBase;

    protected pre_modules_workers: IGeneratorWorker[];
    protected post_modules_workers: IGeneratorWorker[];

    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam };

    constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {

        GeneratorBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ModulesManager.getInstance().isServerSide = true;

        this.pre_modules_workers = [
            Patch20200331DeleteOrphanTranslations.getInstance(),
            Patch20191112CheckExtensions.getInstance(),
            Patch20200131DeleteVersioningVOAccessPolicies.getInstance(),
            Patch20191010CheckBasicSchemas.getInstance(),
            ActivateDataImport.getInstance(),
            ActivateDataRender.getInstance(),
            ChangeTypeDatesNotificationVO.getInstance(),
            ChangeCronDateHeurePlanifiee.getInstance(),
            Patch20191008ChangeDIHDateType.getInstance(),
            Patch20191008ChangeDILDateType.getInstance(),
            Patch20191008SupprimerTacheReimport.getInstance(),
            Patch20200924UpgradeUserVO.getInstance(),
            Patch20201123UpdateVarCacheConfVO.getInstance(),
            Patch20210608TrimUserVO.getInstance()
        ];

        this.post_modules_workers = [
            Patch20191112AddPwdCryptTrigger.getInstance(),
            Patch20191010CreateDefaultLangFRIfNone.getInstance(),
            Patch20191010CreateDefaultAdminAccountIfNone.getInstance(),
            Patch20191018CHECKEnvParamsForMDPRecovery.getInstance(),
            Patch20191106ForceAccessDefaultToVisionFCPP.getInstance(),
            Patch20191126CreateDefaultRobotUserAccount.getInstance(),
            Patch20200131InitUserLogPolicies.getInstance(),
            Patch20200312ChangeResetPWDMailContent.getInstance(),
            Patch20200325PresetExistingLangsChangeRights.getInstance(),
            Patch20200731MailParamsInit.getInstance(),
            Patch20200806InitBaseImageFormats.getInstance(),
            Patch20200914InitTeamsWebhookForDailyReports.getInstance(),
            Patch20200924UpgradeUserVOPost.getInstance(),
            Patch20200926InitPoliciesINSERTORUPDATEUserLogs.getInstance(),
            Patch20201001InitPoliciesFeedback.getInstance(),
            Patch20201006InitFrontVarsPolicies.getInstance(),
            Patch20201125InitVarsBDDIndexes.getInstance(),
            Patch20201214InitFrontVarsPolicies2.getInstance(),
            Patch20201218AddMaintenanceCreationPolicy.getInstance(),
            Patch20210107InitLoggedOnce.getInstance(),
            Patch20210202AnimationPrctReussite.getInstance(),
            Patch20210225AjoutDateCreationCompteUtilisateur.getInstance(),
            Patch20210305affichageIconePDF.getInstance(),
            Patch20210615ChangeLoginTrads.getInstance(),
            Patch20210615ChangeRecoverySMS.getInstance()
        ];
    }

    public async generate() {

        ConfigurationService.getInstance().setEnvParams(this.STATIC_ENV_PARAMS);

        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.getInstance().logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.getInstance().log("Generator starting");
        });

        const envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

        let connectionString = envParam.CONNECTION_STRING;

        let pgp: pg_promise.IMain = pg_promise({});
        let db: IDatabase<any> = pgp(connectionString);

        console.log("pre modules initialization workers...");
        if (!!this.pre_modules_workers) {
            if (!await this.execute_workers(this.pre_modules_workers, db)) {
                process.exit(0);
                return;
            }
        }
        console.log("pre modules initialization workers done.");

        await this.modulesService.register_all_modules(db, true);

        console.log("ModuleSASSSkinConfiguratorServer.getInstance().generate()");
        await ModuleSASSSkinConfiguratorServer.getInstance().generate();
        console.log("ModulesClientInitializationDatasGenerator.getInstance().generate()");
        await ModulesClientInitializationDatasGenerator.getInstance().generate();

        console.log("configure_server_modules...");
        await this.modulesService.configure_server_modules(null);

        console.log("post modules initialization workers...");
        if (!!this.post_modules_workers) {
            if (!await this.execute_workers(this.post_modules_workers, db)) {
                process.exit(0);
                return;
            }
        }
        console.log("post modules initialization workers done.");

        /**
         * On décale les trads après les post modules workers sinon les trads sont pas générées sur créa d'une lang en post worker => cas de la créa de nouveau projet
         */
        console.log("saveDefaultTranslations...");
        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations(true);

        console.log("Generate Vendor: ...");
        await VendorBuilder.getInstance().generate_vendor();
        console.log("Generate Vendor: OK!");

        console.log("Code Generation DONE. Exiting ...");
        process.exit(0);
    }

    private async execute_workers(workers: IGeneratorWorker[], db: IDatabase<any>): Promise<boolean> {
        for (let i in workers) {
            let worker = workers[i];

            // On check que le patch a pas encore été lancé
            try {
                await db.one('select * from generator.workers where uid = $1;', [worker.uid]);
                continue;
            } catch (error) {
                if ((!error) || ((error['message'] != "No data returned from the query.") && (error['code'] != '42P01'))) {

                    console.warn('Patch :' + worker.uid + ': Erreur... [' + error + '], on tente de lancer le patch.');
                } else {
                    console.debug('Patch :' + worker.uid + ': aucune trace de lancement en base, lancement du patch...');
                }
                // Pas d'info en base, le patch a pas été lancé, on le lance
            }

            // Sinon on le lance et on stocke l'info en base
            try {
                await worker.work(db);

                await db.none('CREATE SCHEMA IF NOT EXISTS generator;');
                await db.none('CREATE TABLE IF NOT EXISTS generator.workers (' +
                    'id bigserial NOT NULL,' +
                    'uid text, CONSTRAINT workers_pkey PRIMARY KEY(id));');
                await db.none('insert into generator.workers (uid) values ($1);', [worker.uid]);
            } catch (error) {
                console.error('Patch :' + worker.uid + ': Impossible d\'exécuter le patch : ' + error + '. Arret du générateur.');
                return false;
            }
        }

        return true;
    }
}