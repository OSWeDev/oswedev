import VarDataBaseVO from '../vos/VarDataBaseVO';
import DAG from './dagbase/DAG';
import DAGNodeBase from './dagbase/DAGNodeBase';
import DAGNodeDep from './dagbase/DAGNodeDep';

export default class VarDAGNode extends DAGNodeBase {

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     */
    public static getInstance(dag: DAG<VarDAGNode>, var_data: VarDataBaseVO): VarDAGNode {
        if (!!dag.nodes[var_data.index]) {
            return dag.nodes[var_data.index];
        }

        return new VarDAGNode(dag, var_data/*, is_registered*/).linkToDAG();
    }

    /**
     * Tous les noeuds sont déclarés / initialisés comme des noeuds de calcul. C'est uniquement en cas de split (sur un import ou précalcul partiel)
     *  qu'on va switcher sur un mode aggégateur et configurer des aggregated_nodes
     */
    public is_aggregator: boolean = false;

    /**
     * CAS A : On a une noeud de calcul - qui utilise la fonction compute du VarController : Les dépendances descendantes :
     *  - undefined indique qu'on a pas chargé les deps ou que l'on est en cas B
     *  - toutes les deps doivent donc être chargées en même temps (c'est le cas dans le fonctionnement actuel des VarsControllers)
     */

    /**
     * CAS B : On a une noeud aggregateur - qui utilise la fonction aggregate du VarController : Les noeuds aggrégés
     */
    public aggregated_datas: { [var_data_index: string]: VarDataBaseVO } = {};

    /**
     * Toutes les données chargées pour ce noeud sont disponibles directement ici, classées par datasource
     */
    public datasources: { [ds_name: string]: any } = {};

    /**
     * Indicateurs de performance
     */
    public has_try_load_cache_complet_perf: boolean = false;
    public has_load_imports_and_split_nodes_perf: boolean = false;
    public has_try_load_cache_partiel_perf: boolean = false;
    public has_is_aggregator_perf: boolean = false;
    public has_ds_cache_perf: boolean = false;
    public has_compute_node_perf: boolean = false;
    public has_load_nodes_datas_perf: boolean = false;

    public already_tried_loading_data_and_deploy: boolean = false;
    public already_tried_load_cache_complet: boolean = false;

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public dag: DAG<VarDAGNode>, public var_data: VarDataBaseVO) {
        super();
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep DAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public addOutgoingDep(dep_name: string, outgoing_node: VarDAGNode) {

        /**
         * si la dep est déjà identifiée, ignore
         */
        if (this.outgoing_deps && this.outgoing_deps[dep_name]) {
            return;
        }

        let dep: DAGNodeDep<VarDAGNode> = new DAGNodeDep(dep_name, outgoing_node);

        dep.incoming_node = this;

        if (!this.outgoing_deps) {
            this.outgoing_deps = {};
        }
        this.outgoing_deps[dep.dep_name] = dep;

        if (!dep.outgoing_node.incoming_deps) {
            dep.outgoing_node.incoming_deps = {};
        }
        dep.outgoing_node.incoming_deps[dep.dep_name] = dep;

        if (!!this.dag.roots[dep.outgoing_node.var_data.index]) {
            delete this.dag.roots[dep.outgoing_node.var_data.index];
        }

        if (!!this.dag.leafs[this.var_data.index]) {
            delete this.dag.leafs[this.var_data.index];
        }
    }

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    private linkToDAG(): VarDAGNode {

        this.dag.nodes[this.var_data.index] = this;
        this.dag.nb_nodes++;

        this.dag.leafs[this.var_data.index] = this;
        this.dag.roots[this.var_data.index] = this;

        return this;
    }
}
