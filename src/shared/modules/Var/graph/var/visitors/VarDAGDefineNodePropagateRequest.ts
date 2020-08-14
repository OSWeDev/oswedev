import VarDAG from '../VarDAG';
import VarDAGNode from '../VarDAGNode';

/**
 * Visiteur qui doit charger les deps de voisinage et down pour les ajouter / relier dans l'arbre.
 * Les deps ne sont pas sensées changer, on marque le noeud comme chargé
 */
export default class VarDAGDefineNodePropagateRequest {


    /**
     * On rajoute une remontée du tag de demande d'update dans l'arbre
     */
    public static varDAGPropagateInvalidationToParents(dag: VarDAG) {

        let nodes_names: string[] = Array.from(dag.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE]);

        while (nodes_names && (nodes_names.length > 0)) {
            let nodes_name = nodes_names.shift();
            let node = dag.nodes[nodes_name];

            // On impact => vers tous les incomings
            for (let j in node.incoming) {
                let incoming: VarDAGNode = node.incoming[j] as VarDAGNode;

                if (incoming.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) {
                    continue;
                }

                if (incoming.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE)) {
                    continue;
                }

                incoming.marked_for_update = true;
                if (incoming.marked_for_next_update) {
                    incoming.marked_for_next_update = false;
                }
                nodes_names.push(incoming.name);
            }
        }
    }

    public varDAGVisitorDefineNodePropagateRequest(node: VarDAGNode, dag: VarDAG): boolean {

        if (node.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE) || (!node.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE))) {

            node.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, dag, true);
            return false;
        }

        // On impact => vers tous les incomings
        for (let i in node.incoming) {
            let incoming: VarDAGNode = node.incoming[i] as VarDAGNode;

            if (incoming.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) {
                continue;
            }

            if (incoming.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE)) {
                continue;
            }

            incoming.marked_for_update = true;
            if (incoming.marked_for_next_update) {
                incoming.marked_for_next_update = false;
            }
        }

        // On demande les deps, si elles sont pas déjà calculées
        for (let i in node.outgoing) {
            let outgoing: VarDAGNode = node.outgoing[i] as VarDAGNode;

            if (outgoing.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE)) {
                continue;
            }

            if (outgoing.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) {
                continue;
            }

            if (outgoing.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE)) {
                continue;
            }

            outgoing.marked_for_update = true;
            if (outgoing.marked_for_next_update) {
                outgoing.marked_for_next_update = false;
            }
        }

        node.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, dag, true);
        node.addMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE, dag);
        return false;
    }
}