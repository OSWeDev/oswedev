import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleDocument from '../../../shared/modules/Document/ModuleDocument';
import DocumentLangVO from '../../../shared/modules/Document/vos/DocumentLangVO';
import DocumentTagGroupLangVO from '../../../shared/modules/Document/vos/DocumentTagGroupLangVO';
import DocumentTagGroupVO from '../../../shared/modules/Document/vos/DocumentTagGroupVO';
import DocumentTagLangVO from '../../../shared/modules/Document/vos/DocumentTagLangVO';
import DocumentTagVO from '../../../shared/modules/Document/vos/DocumentTagVO';
import DocumentVO from '../../../shared/modules/Document/vos/DocumentVO';
import ModuleTable from '../../../shared/modules/ModuleTable';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ModulesManagerServer from '../ModulesManagerServer';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import EnvParam from '../../env/EnvParam';
import ConfigurationService from '../../env/ConfigurationService';

export default class ModuleDocumentServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDocumentServer.instance) {
            ModuleDocumentServer.instance = new ModuleDocumentServer();
        }
        return ModuleDocumentServer.instance;
    }

    private static instance: ModuleDocumentServer = null;

    private constructor() {
        super(ModuleDocument.getInstance().name);
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleDocument.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Documents'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleDocument.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des Documents'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleDocument.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            fr: 'Accès front - Documents'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async configure() {

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Youtube' },
            'DOCUMENT.DOCUMENT_TYPE.YOUTUBE'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'PDF' },
            'DOCUMENT.DOCUMENT_TYPE.PDF'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'PPT' },
            'DOCUMENT.DOCUMENT_TYPE.PPT'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'XLS' },
            'DOCUMENT.DOCUMENT_TYPE.XLS'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'DOC' },
            'DOCUMENT.DOCUMENT_TYPE.DOC'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'AUTRE' },
            'DOCUMENT.DOCUMENT_TYPE.OTHER'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'XS' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.XS'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'S' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.S'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'M' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.M'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'L' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.L'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'XL' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.XL'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'XXL' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.XXL'));

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Documents' },
            'menu.menuelements.DocumentAdminVueModule.___LABEL___'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Feedbacks' },
            'menu.menuelements.FeedbackAdminVueModule.___LABEL___'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Documents' },
            'menu.menuelements.document.___LABEL___'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Tags' },
            'menu.menuelements.dt.___LABEL___'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Groupes de tags' },
            'menu.menuelements.dtg.___LABEL___'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Feedbacks' },
            'menu.menuelements.feedback.___LABEL___'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: ' ' },
            'tstz_input.placeholder.date_debut.___LABEL___'));

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Documentation' },
            'document_handler.modal_title.___LABEL___'));

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Tous' },
            'document_handler.tags.tous.___LABEL___'));

        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(DocumentVO.API_TYPE_ID, this.force_document_path_from_file.bind(this));
        preUpdateTrigger.registerHandler(DocumentVO.API_TYPE_ID, this.force_document_path_from_file.bind(this));
    }

    public registerServerApiHandlers() {
    }

    public registerAccessHooks(): void {

        ModuleAPI.getInstance().registerServerApiHandler(ModuleDocument.APINAME_get_ds_by_user_lang, this.get_ds_by_user_lang.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDocument.APINAME_get_dts_by_user_lang, this.get_dts_by_user_lang.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDocument.APINAME_get_dtgs_by_user_lang, this.get_dtgs_by_user_lang.bind(this));
    }

    private async force_document_path_from_file(d: DocumentVO): Promise<boolean> {

        if (!d) {
            return false;
        }

        if (!d.file_id) {
            return true;
        }

        let envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();
        let file: FileVO = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, d.file_id);

        if (!file) {
            return false;
        }

        let url = envParam.BASE_URL + file.path;
        if (envParam.BASE_URL.endsWith('/') && file.path.startsWith('/')) {
            url = envParam.BASE_URL + file.path.substr(1, file.path.length - 1);
        }

        d.document_url = url;
        return true;
    }

    private async get_ds_by_user_lang(): Promise<DocumentVO[]> {
        let vos: DocumentVO[] = await ModuleDAO.getInstance().getVos<DocumentVO>(DocumentVO.API_TYPE_ID);
        if ((!vos) || (!vos.length)) {
            return vos;
        }

        let user_lang: LangVO = await ModuleAccessPolicyServer.getInstance().getMyLang();
        if (!user_lang) {
            return null;
        }

        let res: DocumentVO[] = [];
        let d_ids: number[] = ObjectHandler.getInstance().getIdsList(vos);
        let d_by_ids: { [id: number]: DocumentVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(vos);
        let doc_langs: DocumentLangVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds(DocumentLangVO.API_TYPE_ID, 'lang_id', [user_lang.id], 'd_id', d_ids);

        for (let i in doc_langs) {
            let doc_lang = doc_langs[i];

            res.push(d_by_ids[doc_lang.d_id]);
        }
        return res;
    }

    private async get_dts_by_user_lang(): Promise<DocumentTagVO[]> {
        let vos: DocumentTagVO[] = await ModuleDAO.getInstance().getVos<DocumentTagVO>(DocumentTagVO.API_TYPE_ID);
        if ((!vos) || (!vos.length)) {
            return vos;
        }

        let user_lang: LangVO = await ModuleAccessPolicyServer.getInstance().getMyLang();
        if (!user_lang) {
            return null;
        }

        let res: DocumentTagVO[] = [];
        let dt_ids: number[] = ObjectHandler.getInstance().getIdsList(vos);
        let dt_by_ids: { [id: number]: DocumentTagVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(vos);
        let doc_langs: DocumentTagLangVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds(DocumentTagLangVO.API_TYPE_ID, 'lang_id', [user_lang.id], 'dt_id', dt_ids);

        for (let i in doc_langs) {
            let doc_lang = doc_langs[i];

            res.push(dt_by_ids[doc_lang.dt_id]);
        }
        return res;
    }

    private async get_dtgs_by_user_lang(): Promise<DocumentTagGroupVO[]> {
        let vos: DocumentTagGroupVO[] = await ModuleDAO.getInstance().getVos<DocumentTagGroupVO>(DocumentTagGroupVO.API_TYPE_ID);
        if ((!vos) || (!vos.length)) {
            return vos;
        }

        let user_lang: LangVO = await ModuleAccessPolicyServer.getInstance().getMyLang();
        if (!user_lang) {
            return null;
        }

        let res: DocumentTagGroupVO[] = [];
        let dtg_ids: number[] = ObjectHandler.getInstance().getIdsList(vos);
        let dtg_by_ids: { [id: number]: DocumentTagGroupVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(vos);
        let doc_langs: DocumentTagGroupLangVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds(DocumentTagGroupLangVO.API_TYPE_ID, 'lang_id', [user_lang.id], 'dtg_id', dtg_ids);

        for (let i in doc_langs) {
            let doc_lang = doc_langs[i];

            res.push(dtg_by_ids[doc_lang.dtg_id]);
        }
        return res;
    }
}