import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from '../DAO/triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import TranslationCronWorkersHandler from './TranslationCronWorkersHandler';
import TranslationsServerController from './TranslationsServerController';

export default class ModuleTranslationServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleTranslationServer.instance) {
            ModuleTranslationServer.instance = new ModuleTranslationServer();
        }
        return ModuleTranslationServer.instance;
    }

    private static instance: ModuleTranslationServer = null;

    /**
     * Local thread cache -----
     */
    public policy_group: AccessPolicyGroupVO = null;
    /**
     * ----- Local thread cache
     */

    private constructor() {
        super(ModuleTranslation.getInstance().name);
    }

    public registerCrons(): void {
        TranslationCronWorkersHandler.getInstance();
    }

    public async configure() {
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(TranslatableTextVO.API_TYPE_ID, this.onPreCreateTranslatableTextVO);

        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(TranslatableTextVO.API_TYPE_ID, this.onPreUpdateTranslatableTextVO);

        let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        let preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
        postCreateTrigger.registerHandler(LangVO.API_TYPE_ID, this.trigger_oncreate_lang);
        preDeleteTrigger.registerHandler(LangVO.API_TYPE_ID, this.trigger_ondelete_lang);

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Traductions'
        }, 'TranslationsImportDefaultFormatLabels.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Traductions'
        }, 'menu.menuelements.__i__import_translation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Traductions'
        }, 'menu.menuelements._i_import_translation.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Traduction'
        }, 'fields.labels.ref.module_translation_translation.___LABEL____lang_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Traduction'
        }, 'fields.labels.ref.module_translation_translation.___LABEL____text_id'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Utilisateur'
        }, 'fields.labels.ref.user.___LABEL____lang_id'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Une erreur empêche la validation de la saisie'
        }, 'field.validate_input.error.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Echec de mise à jour de la valeur du champs'
        }, 'field.auto_update_field_value.failed.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Une erreur serveur a eue lieu et vous empêche de modifier la valeur de ce champs. Essayez de modifier la valeur et de l\'enregistrer à nouveau et si le problème persiste, contactez votre équipe technique en indiquant le champs de saisie et le texte que vous souhaitez valider.'
        }, 'field.auto_update_field_value.server_error.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modification enregistrée'
        }, 'field.auto_update_field_value.succes.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non'
        }, 'NO'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Oui'
        }, 'YES'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Annuler'
        }, 'admin.logout.cancel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Choisissez "Déconnexion"'
        }, 'admin.logout.content.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Déconnexion'
        }, 'admin.logout.ok.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Déconnexion'
        }, 'admin.logout.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Import des traductions'
        }, 'import.translations.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Codes textes'
        }, 'menu.menuelements.TranslatableTextVOTranslationAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Internationalisation'
        }, 'menu.menuelements.TranslationAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Traductions'
        }, 'menu.menuelements.TranslationVOTranslationAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Import des traductions'
        }, 'menu.menuelements.TranslationsImport.___LABEL___'));





        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'CRON'
        }, 'cron.component.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'CRON'
        }, 'cron.component.head.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Lancer les tâches'
        }, 'cron.run_cron.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Ajouter'
        }, 'crud.actions.create.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Exporter'
        }, 'crud.actions.export.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Actualiser'
        }, 'crud.actions.refresh.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Tout supprimer'
        }, 'crud.actions.delete_all.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer TOUTES les données ? Les filtrages sont ignorés'
        }, 'crud.actions.delete_all.confirmation.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'ATTENTION'
        }, 'crud.actions.delete_all.confirmation.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression en cours...'
        }, 'crud.actions.delete_all.start.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Ajouter'
        }, 'crud.create.modal.add.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Annuler'
        }, 'crud.create.modal.cancel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Nouveau'
        }, 'crud.create.modal.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Ajout : En cours...'
        }, 'crud.create.starting.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Ajout : OK'
        }, 'crud.create.success.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Annuler'
        }, 'crud.delete.modal.cancel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer'
        }, 'crud.delete.modal.content.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Echec de sélection'
        }, 'crud.delete.modal.content.selection_failure.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer'
        }, 'crud.delete.modal.content.warning.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer'
        }, 'crud.delete.modal.delete.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer'
        }, 'crud.delete.modal.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression : En cours...'
        }, 'crud.delete.starting.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression : OK'
        }, 'crud.delete.success.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non'
        }, 'crud.field.boolean.false.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Non renseigné'
        }, 'crud.field.boolean.n_a.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Oui'
        }, 'crud.field.boolean.true.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Données - {datatable_title}'
        }, 'crud.read.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Annuler'
        }, 'crud.update.modal.cancel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Edition : Echec de sélection'
        }, 'crud.update.modal.content.selection_failure.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Enregistrer'
        }, 'crud.update.modal.save.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modifier'
        }, 'crud.update.modal.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modification : En cours...'
        }, 'crud.update.starting.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modification : OK'
        }, 'crud.update.success.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modification : KO'
        }, 'crud.update.errors.update_failure.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Actions'
        }, 'datatable.actions_column.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Champ requis non renseigné'
        }, 'crud.check_form.field_required.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Colonnes'
        }, 'datatable.columns.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Affichage des résultats ###from-## à ###to-## (sur un total de ###count-##)|###count-## résultats|A résultat'
        }, 'datatable.count.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélectionner ###column-##'
        }, 'datatable.default_option.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Filtrer:'
        }, 'datatable.filter.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Filtrer par ###column-##'
        }, 'datatable.filter_by.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Recherche'
        }, 'datatable.filter_place_holder.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Premier'
        }, 'datatable.first.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dernier'
        }, 'datatable.last.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Résultats:'
        }, 'datatable.limit.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Chargement...'
        }, 'datatable.loading.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Aucun résultat'
        }, 'datatable.no_results.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Page:'
        }, 'datatable.page.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictCancelUpload'
        }, 'dropzone.dictCancelUpload.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictCancelUploadConfirmation'
        }, 'dropzone.dictCancelUploadConfirmation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictDefaultMessage'
        }, 'dropzone.dictDefaultMessage.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictFallbackMessage'
        }, 'dropzone.dictFallbackMessage.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictFallbackText'
        }, 'dropzone.dictFallbackText.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictFileSizeUnits'
        }, 'dropzone.dictFileSizeUnits.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictFileTooBig'
        }, 'dropzone.dictFileTooBig.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictInvalidFileType'
        }, 'dropzone.dictInvalidFileType.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictMaxFilesExceeded'
        }, 'dropzone.dictMaxFilesExceeded.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictRemoveFile'
        }, 'dropzone.dictRemoveFile.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictRemoveFileConfirmation'
        }, 'dropzone.dictRemoveFileConfirmation.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictResponseError'
        }, 'dropzone.dictResponseError.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'dictUploadCanceled'
        }, 'dropzone.dictUploadCanceled.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Aucun historique'
        }, 'import.modal.no_hisotoric.___LABEL___'));



        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'CRON'
        }, 'menu.menuelements.CronAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Exécution'
        }, 'menu.menuelements.CronRun.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Planification'
        }, 'menu.menuelements.CronWorkerPlanification.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Administration des fichiers'
        }, 'menu.menuelements.FileAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Fichier'
        }, 'menu.menuelements.FileVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Langues'
        }, 'menu.menuelements.LangVOTranslationAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modules'
        }, 'menu.menuelements.ModuleVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modules'
        }, 'menu.menuelements.ModulesAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Role policy'
        }, 'menu.menuelements.RolePolicyVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Rôle'
        }, 'menu.menuelements.RoleVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Configuration des Vars'
        }, 'menu.menuelements.SimpleVarConfVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Utilisateurs'
        }, 'menu.menuelements.UserVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Variables'
        }, 'menu.menuelements.VarAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Access policy'
        }, 'menu.menuelements.module_access_policy.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Module Format dates/nombres'
        }, 'menu.menuelements.module_format_dates_nombres.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Module Mailer'
        }, 'menu.menuelements.module_mailer.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Module SASS'
        }, 'menu.menuelements.module_sass_resource_planning_skin_configurator.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Fermer'
        }, 'on_page_translation.close_button_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Autres langues'
        }, 'on_page_translation.hide_other_langs.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Importer les traductions'
        }, 'on_page_translation.import_translations.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Ouvrir'
        }, 'on_page_translation.open_button_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Autres langues'
        }, 'on_page_translation.show_other_langs.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Surcharger'
        }, 'translations_import_params.overwrite.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Manuel utilisateur'
        }, 'client.learning.book.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'http://www.wedev.fr/'
        }, 'client.learning.link.manual.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'http://www.wedev.fr/'
        }, 'client.learning.link.youtube.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Tutoriel'
        }, 'client.learning.youtube.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Déconnexion'
        }, 'client.logout.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Wedev'
        }, 'client.main-title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Admin'
        }, 'client.menu-gauche.admin'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Menu principal'
        }, 'client.menu-gauche.navigationPrincipale'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Janvier'
        }, 'label.month.janvier.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Février'
        }, 'label.month.fevrier.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mars'
        }, 'label.month.mars.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Avril'
        }, 'label.month.avril.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mai'
        }, 'label.month.mai.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Juin'
        }, 'label.month.juin.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Juillet'
        }, 'label.month.juillet.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Août'
        }, 'label.month.aout.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Septembre'
        }, 'label.month.septembre.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Octobre'
        }, 'label.month.octobre.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Novembre'
        }, 'label.month.novembre.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Décembre'
        }, 'label.month.decembre.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dimanche'
        }, 'label.day.dimanche.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Lundi'
        }, 'label.day.lundi.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mardi'
        }, 'label.day.mardi.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mercredi'
        }, 'label.day.mercredi.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Jeudi'
        }, 'label.day.jeudi.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Vendredi'
        }, 'label.day.vendredi.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Samedi'
        }, 'label.day.samedi.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'tous'
        }, 'select_all.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'aucun'
        }, 'select_none.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélectionner'
        }, 'multiselect.selectLabel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélectionner'
        }, 'multiselect.selectGroupLabel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Sélectionné'
        }, 'multiselect.selectedLabel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dé-sélectionner'
        }, 'multiselect.deselectLabel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Dé-sélectionner'
        }, 'multiselect.deselectGroupLabel.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Début'
        }, 'num_range_input.debut.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Fin'
        }, 'num_range_input.fin.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Valeur Simple'
        }, 'num_range_input.is_single.on.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Tranche de valeurs'
        }, 'num_range_input.is_single.off.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Accès au choix de la langue'
        }, 'access.policies.names.Translation.LANG_SELECTOR_PER_LANG_ACCESS_PREFIX_1.___LABEL___'));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleTranslation.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Traductions'
        }));
        this.policy_group = group;

        let bo_translations_access: AccessPolicyVO = new AccessPolicyVO();
        bo_translations_access.group_id = group.id;
        bo_translations_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_translations_access.translatable_name = ModuleTranslation.POLICY_BO_TRANSLATIONS_ACCESS;
        bo_translations_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_translations_access, new DefaultTranslation({
            fr: 'Administration des traductions'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        // let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        // admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        // admin_access_dependency.src_pol_id = bo_translations_access.id;
        // admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().registered_policies[ModuleAccessPolicy.POLICY_BO_ACCESS].id;
        // await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let bo_others_access: AccessPolicyVO = new AccessPolicyVO();
        bo_others_access.group_id = group.id;
        bo_others_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_others_access.translatable_name = ModuleTranslation.POLICY_BO_OTHERS_ACCESS;
        bo_others_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_others_access, new DefaultTranslation({
            fr: 'Administration des langues et codes de traduction'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        // admin_access_dependency = new PolicyDependencyVO();
        // admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        // admin_access_dependency.src_pol_id = bo_others_access.id;
        // admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().registered_policies[ModuleAccessPolicy.POLICY_BO_ACCESS].id;
        // await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
        let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = bo_others_access.id;
        access_dependency.depends_on_pol_id = bo_translations_access.id;
        access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);

        let on_page_translation_module_access: AccessPolicyVO = new AccessPolicyVO();
        on_page_translation_module_access.group_id = group.id;
        on_page_translation_module_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        on_page_translation_module_access.translatable_name = ModuleTranslation.POLICY_ON_PAGE_TRANSLATION_MODULE_ACCESS;
        on_page_translation_module_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(on_page_translation_module_access, new DefaultTranslation({
            fr: 'Module de traduction sur page'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        access_dependency = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = on_page_translation_module_access.id;
        access_dependency.depends_on_pol_id = bo_translations_access.id;
        access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);

        let LANG_SELECTOR_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        LANG_SELECTOR_ACCESS.group_id = group.id;
        LANG_SELECTOR_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        LANG_SELECTOR_ACCESS.translatable_name = ModuleTranslation.POLICY_LANG_SELECTOR_ACCESS;
        LANG_SELECTOR_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(LANG_SELECTOR_ACCESS, new DefaultTranslation({
            fr: 'Outil - Choix de la langue'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS, this.getAllTranslations.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_LANGS, this.getLangs.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_LANG, this.getLang.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT, this.getTranslatableText.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS, this.getTranslatableTexts.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATION, this.getTranslation.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATIONS, this.getTranslations.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_getALL_LOCALES, this.getALL_LOCALES.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_LABEL, this.label.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_T, this.t.bind(this));
    }

    public async getTranslatableTexts(): Promise<TranslatableTextVO[]> {
        return await ModuleDAO.getInstance().getVos<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID);
    }

    public async getTranslatableText(text: string): Promise<TranslatableTextVO> {
        return await ModuleDAOServer.getInstance().selectOne<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, 'where code_text = $1', [text]);
    }

    public async getLang(text: string): Promise<LangVO> {
        return await ModuleDAOServer.getInstance().selectOne<LangVO>(LangVO.API_TYPE_ID, 'where code_lang = $1', [text]);
    }

    public async getLangs(): Promise<LangVO[]> {
        return await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);
    }

    public async getAllTranslations(): Promise<TranslationVO[]> {
        return await ModuleDAO.getInstance().getVos<TranslationVO>(TranslationVO.API_TYPE_ID);
    }

    public async getTranslations(num: number): Promise<TranslationVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<TranslationVO>(TranslationVO.API_TYPE_ID, 'WHERE t.lang_id = $1', [num]);
    }

    public async getTranslation(lang_id: number, text_id: number): Promise<TranslationVO> {
        return await ModuleDAOServer.getInstance().selectOne<TranslationVO>(TranslationVO.API_TYPE_ID, 'WHERE t.lang_id = $1 and t.text_id = $2', [lang_id, text_id]);
    }

    private async trigger_oncreate_lang(lang: LangVO) {
        let LANG_SELECTOR_PER_LANG_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        LANG_SELECTOR_PER_LANG_ACCESS.group_id = ModuleTranslationServer.getInstance().policy_group.id;
        LANG_SELECTOR_PER_LANG_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        LANG_SELECTOR_PER_LANG_ACCESS.translatable_name = ModuleTranslation.getInstance().get_LANG_SELECTOR_PER_LANG_ACCESS_name(lang.id);
        LANG_SELECTOR_PER_LANG_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(LANG_SELECTOR_PER_LANG_ACCESS, new DefaultTranslation({
            fr: 'Outil - Peut choisir la langue : ' + lang.code_lang
        }), await ModulesManagerServer.getInstance().getModuleVOByName(ModuleTranslationServer.getInstance().name));
    }

    private async trigger_ondelete_lang(lang: LangVO): Promise<boolean> {
        let LANG_SELECTOR_PER_LANG_ACCESS: AccessPolicyVO = AccessPolicyServerController.getInstance().get_registered_policy(ModuleTranslation.getInstance().get_LANG_SELECTOR_PER_LANG_ACCESS_name(lang.id));
        if (!LANG_SELECTOR_PER_LANG_ACCESS) {
            return false;
        }
        await ModuleDAO.getInstance().deleteVOs([LANG_SELECTOR_PER_LANG_ACCESS]);
        return true;
    }

    private async getALL_LOCALES(): Promise<{ [code_lang: string]: any }> {
        let langs: LangVO[] = await this.getLangs();
        let translatableTexts: TranslatableTextVO[] = await this.getTranslatableTexts();
        let translatableTexts_by_id: { [id: number]: TranslatableTextVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(translatableTexts);
        let res: { [code_lang: string]: any } = {};

        for (let i in langs) {
            let lang: LangVO = langs[i];
            let translations: TranslationVO[] = await ModuleTranslation.getInstance().getTranslations(lang.id);

            for (let j in translations) {
                let translation: TranslationVO = translations[j];

                if (!translation.text_id) {
                    continue;
                }

                res = TranslationsServerController.getInstance().addCodeToLocales(res, lang.code_lang.toLowerCase(), translatableTexts_by_id[translation.text_id].code_text, translation.translated);
            }
        }
        return res;
    }

    private async t(code_text: string, lang_id: number): Promise<string> {
        let translatable = await ModuleDAOServer.getInstance().selectOne<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, 'where code_text = $1', [code_text]);

        if (!translatable) {
            return null;
        }

        let translation = await ModuleDAOServer.getInstance().selectOne<TranslationVO>(TranslationVO.API_TYPE_ID, 'WHERE t.lang_id = $1 and t.text_id = $2', [lang_id, translatable.id]);

        return translation.translated;
    }

    private async label(code_text: string, lang_id: number): Promise<string> {
        code_text += DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        return await this.t(code_text, lang_id);
    }

    private async onPreCreateTranslatableTextVO(vo: TranslatableTextVO): Promise<boolean> {
        if ((!vo) || (!vo.code_text)) {
            return false;
        }
        return await ModuleTranslationServer.getInstance().isCodeOk(vo.code_text);
    }

    private async onPreUpdateTranslatableTextVO(vo_update_handler: DAOUpdateVOHolder<TranslatableTextVO>): Promise<boolean> {

        if ((!vo_update_handler.post_update_vo) || (!vo_update_handler.post_update_vo.code_text)) {
            return false;
        }
        return await ModuleTranslationServer.getInstance().isCodeOk(vo_update_handler.post_update_vo.code_text);
    }

    private async isCodeOk(code_text: string): Promise<boolean> {

        // On vérifie qu'il existe pas en base un code conflictuel. Sinon on refuse l'insert
        let something_longer: TranslatableTextVO[] = await ModuleDAOServer.getInstance().selectAll<TranslatableTextVO>(
            TranslatableTextVO.API_TYPE_ID,
            " WHERE t.code_text like '" + code_text + ".%'");

        if ((!!something_longer) && (something_longer.length > 0)) {
            return false;
        }

        let shorter_code: string = code_text;
        let segments: string[] = shorter_code.split('.');

        while ((!!segments) && (segments.length > 1)) {

            segments.pop();
            shorter_code = segments.join('.');

            let something_shorter: TranslatableTextVO[] = await ModuleDAOServer.getInstance().selectAll<TranslatableTextVO>(
                TranslatableTextVO.API_TYPE_ID,
                " WHERE t.code_text = $1", [shorter_code]);

            if ((!!something_shorter) && (something_shorter.length > 0)) {
                return false;
            }
        }

        return true;
    }
}