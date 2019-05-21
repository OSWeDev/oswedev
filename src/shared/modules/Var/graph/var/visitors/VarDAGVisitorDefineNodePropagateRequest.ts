import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';
import VarDAGNode from '../VarDAGNode';

/**
 * Visiteur qui doit charger les deps de voisinage et down pour les ajouter / relier dans l'arbre.
 * Les deps ne sont pas sensées changer, on marque le noeud comme chargé
 */
export default class VarDAGVisitorDefineNodePropagateRequest extends DAGVisitorBase<VarDAG> {


    public constructor(dag: VarDAG) {
        super(true, dag);
    }

    public async visit(node: VarDAGNode, path: string[]): Promise<boolean> {
        return await this.varDAGVisitorDefineNodePropagateRequest(node, path);
    }

    public async varDAGVisitorDefineNodePropagateRequest(node: VarDAGNode, path: string[]): Promise<boolean> {

        if (node.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE) || (!node.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE))) {
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

            incoming.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.dag);
            if (incoming.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE)) {
                incoming.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE, this.dag, true);
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

            outgoing.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.dag);
            if (outgoing.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE)) {
                outgoing.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE, this.dag, true);
            }
        }

        node.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.dag, true);
        node.addMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE, this.dag);
        return false;
    }
}