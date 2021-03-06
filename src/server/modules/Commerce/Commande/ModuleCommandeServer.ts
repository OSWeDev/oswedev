import APIControllerWrapper from '../../../../shared/modules/API/APIControllerWrapper';
import ModuleAPI from '../../../../shared/modules/API/ModuleAPI';
import ClientVO from '../../../../shared/modules/Commerce/Client/vos/ClientVO';
import ModuleCommande from '../../../../shared/modules/Commerce/Commande/ModuleCommande';
import CommandeVO from '../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import LigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/LigneCommandeVO';
import ParamLigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/ParamLigneCommandeVO';
import ProduitParamLigneParamVO from '../../../../shared/modules/Commerce/Produit/vos/apis/ProduitParamLigneParamVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ModuleAccessPolicyServer from '../../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleServerBase from '../../ModuleServerBase';
import ModuleClientServer from '../Client/ModuleClientServer';
import ModuleProduitServer from '../Produit/ModuleProduitServer';
const moment = require('moment');

export default class ModuleCommandeServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleCommandeServer.instance) {
            ModuleCommandeServer.instance = new ModuleCommandeServer();
        }
        return ModuleCommandeServer.instance;
    }

    private static instance: ModuleCommandeServer = null;

    constructor() {
        super(ModuleCommande.getInstance().name);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleCommande.APINAME_getCommandesUser, this.getCommandesUser.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleCommande.APINAME_getLignesCommandeByCommandeId, this.getLignesCommandeByCommandeId.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleCommande.APINAME_ajouterAuPanier, this.ajouterAuPanier.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleCommande.APINAME_getParamLigneCommandeById, this.getParamLigneCommandeById.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleCommande.APINAME_creationPanier, this.creationPanier.bind(this));
    }

    public async getCommandesUser(num: number): Promise<CommandeVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<CommandeVO>(
            CommandeVO.API_TYPE_ID,
            ' JOIN ' + VOsTypesManager.getInstance().moduleTables_by_voType[ClientVO.API_TYPE_ID].full_name + ' c on c.id = t.client_id ' +
            ' WHERE c.user_id = $1', [num]
        );
    }

    public async getLignesCommandeByCommandeId(num: number): Promise<LigneCommandeVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<LigneCommandeVO>(
            LigneCommandeVO.API_TYPE_ID,
            ' JOIN ' + VOsTypesManager.getInstance().moduleTables_by_voType[CommandeVO.API_TYPE_ID].full_name + ' commande on commande.id = t.commande_id ' +
            ' JOIN ' + VOsTypesManager.getInstance().moduleTables_by_voType[ClientVO.API_TYPE_ID].full_name + ' client on client.id = commande.client_id ' +
            ' WHERE t.commande_id = $1', [num]
        );
    }

    public async creationPanier(): Promise<CommandeVO> {
        let client: ClientVO = await ModuleClientServer.getInstance().getFirstClientByUserId(ModuleAccessPolicyServer.getInstance().getLoggedUserId());
        let panier: CommandeVO = new CommandeVO();
        panier.client_id = (client) ? client.id : null;
        panier.date = moment().utc(true).toLocaleString();
        panier.statut = CommandeVO.STATUT_PANIER;

        let result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(panier);
        panier.id = result.id;

        return panier;
    }

    public async ajouterAuPanier(
        produitsParam: ProduitParamLigneParamVO[],
        commande: CommandeVO
    ): Promise<CommandeVO> {

        if (produitsParam) {
            for (let i in produitsParam) {
                this.ajouterLigneCommande(commande, produitsParam[i]);
            }
        }

        return commande;
    }

    public async getParamLigneCommandeById(num: number, text: string): Promise<ParamLigneCommandeVO> {
        return await ModuleDAOServer.getInstance().selectOne<ParamLigneCommandeVO>(
            text,
            ' WHERE t.ligne_commande_id = $1', [num]
        );
    }

    private async ajouterLigneCommande(commande: CommandeVO, produitParam: ProduitParamLigneParamVO): Promise<void> {
        if (!commande || !produitParam) {
            return null;
        }

        let client: ClientVO = await ModuleClientServer.getInstance().getFirstClientByUserId(ModuleAccessPolicyServer.getInstance().getLoggedUserId());
        let ligne: LigneCommandeVO = new LigneCommandeVO();
        ligne.commande_id = commande.id;
        ligne.informations_id = (client) ? client.informations_id : null;
        ligne.prix_unitaire = await ModuleProduitServer.getInstance().getPrixProduit(produitParam.produit, produitParam.produit_custom, produitParam.ligneParam);
        ligne.produit_id = produitParam.produit.id;
        ligne.quantite = 1;

        let result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(ligne);
        produitParam.ligneParam.ligne_commande_id = result.id;

        await ModuleDAO.getInstance().insertOrUpdateVO(produitParam.ligneParam);
    }
}