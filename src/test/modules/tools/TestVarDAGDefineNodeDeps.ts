// import ServerAPIController from '../../../server/modules/API/ServerAPIController';
// import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
// APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();
// import { expect } from 'chai';
// import 'mocha';
// import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
// import VarDAG from '../../../shared/modules/Var/graph/var/VarDAG';
// import VarDAGNode from '../../../shared/modules/Var/graph/var/VarDAGNode';
// import VarDAGDefineNodeDeps from '../../../shared/modules/Var/graph/var/visitors/VarDAGDefineNodeDeps';
// import IVarDataVOBase from '../../../shared/modules/Var/interfaces/IVarDataVOBase';
// import VarDataBaseVO from '../../../shared/modules/Var/params/VarDataBaseVO';
// import SimpleVarConfVO from '../../../shared/modules/Var/simple_vars/SimpleVarConfVO';
// import VarsController from '../../../shared/modules/Var/VarsController';
// import RangeHandler from '../../../shared/tools/RangeHandler';
// import FakeVarController from '../Var/fakes/FakeVarController';
// import FakeDataVO from '../Var/fakes/vos/FakeDataVO';
// import moment = require('moment');

// describe('VarDAGDefineNodeDeps', () => {

//     let varConf: SimpleVarConfVO = new SimpleVarConfVO();
//     varConf.id = 1;
//     varConf.name = "varConf";
//     varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


//     it('test clear_node_deps', () => {
//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         VarDAGDefineNodeDeps.clear_node_deps(null, null);

//         let index1: string = "1_20190101_1_1";
//         let index2: string = "1_20190102_1_1";
//         let index3: string = "1_20190103_1_1";

//         let node_param1: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);
//         let node_param2: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);
//         let node_param3: IVarDataVOBase = VarDataBaseVO.createNew('fake_type', 1);

//         let dag = new VarDAG((name: string, d: VarDAG, param: IVarDataVOBase) => new VarDAGNode(name, d, param), null);
//         let node = dag.add(index1, node_param1);

//         /**
//          * TODO FIXME : VarDAG tests indépendants de clear_node_deps
//          */
//         expect(dag.nodes_names.length).to.equal(1);
//         expect(dag.nodes_names).to.deep.equal([index1]);
//         expect(dag.roots).to.deep.equal({
//             [index1]: node
//         });
//         expect(dag.leafs).to.deep.equal({
//             [index1]: node
//         });
//         expect(node.outgoingNames.length).to.equal(0);
//         expect(node.incomingNames.length).to.equal(0);

//         VarDAGDefineNodeDeps.clear_node_deps(node, dag);
//         expect(dag.nodes_names.length).to.equal(1);
//         expect(dag.nodes_names).to.deep.equal([index1]);
//         expect(dag.roots).to.deep.equal({
//             [index1]: node
//         });
//         expect(dag.leafs).to.deep.equal({
//             [index1]: node
//         });
//         expect(node.outgoingNames.length).to.equal(0);
//         expect(node.incomingNames.length).to.equal(0);

//         dag.deletedNode(node.name, () => true);

//         expect(dag.nodes_names.length).to.equal(0);
//         expect(dag.nodes_names).to.deep.equal([]);
//         expect(dag.roots).to.deep.equal({});
//         expect(dag.leafs).to.deep.equal({});

//         VarDAGDefineNodeDeps.clear_node_deps(node, dag);

//         expect(dag.nodes_names.length).to.equal(0);
//         expect(dag.nodes_names).to.deep.equal([]);
//         expect(dag.roots).to.deep.equal({});
//         expect(dag.leafs).to.deep.equal({});

//         let node1 = dag.add(index1, node_param1);
//         let node2 = dag.add(index2, node_param2);
//         let node3 = dag.add(index3, node_param3);

//         dag.addEdge(node3.name, node2.name);
//         dag.addEdge(node2.name, node1.name);

//         expect(dag.nodes_names.length).to.equal(3);
//         expect(dag.nodes_names).to.deep.equal([index1, index2, index3]);
//         expect(dag.roots).to.deep.equal({
//             [index3]: node3
//         });
//         expect(dag.leafs).to.deep.equal({
//             [index1]: node1
//         });
//         expect(node1.outgoingNames.length).to.equal(0);
//         expect(node1.incomingNames.length).to.equal(1);

//         expect(node2.outgoingNames.length).to.equal(1);
//         expect(node2.incomingNames.length).to.equal(1);

//         expect(node3.outgoingNames.length).to.equal(1);
//         expect(node3.incomingNames.length).to.equal(0);

//         VarDAGDefineNodeDeps.clear_node_deps(node2, dag);

//         expect(dag.nodes_names.length).to.equal(2);
//         expect(dag.nodes_names).to.deep.equal([index2, index3]);
//         expect(dag.roots).to.deep.equal({
//             [index3]: node3
//         });
//         expect(dag.leafs).to.deep.equal({
//             [index2]: node2
//         });

//         expect(node2.outgoingNames.length).to.equal(0);
//         expect(node2.incomingNames.length).to.equal(1);

//         expect(node3.outgoingNames.length).to.equal(1);
//         expect(node3.incomingNames.length).to.equal(0);

//         VarDAGDefineNodeDeps.clear_node_deps(node3, dag);

//         expect(dag.nodes_names.length).to.equal(1);
//         expect(dag.nodes_names).to.deep.equal([index3]);
//         expect(dag.roots).to.deep.equal({
//             [index3]: node3
//         });
//         expect(dag.leafs).to.deep.equal({
//             [index3]: node3
//         });
//         expect(node3.outgoingNames.length).to.equal(0);
//         expect(node3.incomingNames.length).to.equal(0);

//         dag.deletedNode(node3.name, () => true);


//         node1 = dag.add(index1, node_param1);
//         node2 = dag.add(index2, node_param2);
//         node3 = dag.add(index3, node_param3);

//         dag.addEdge(node3.name, node2.name);
//         dag.addEdge(node2.name, node1.name);

//         expect(dag.nodes_names.length).to.equal(3);
//         expect(dag.nodes_names).to.deep.equal([index1, index2, index3]);
//         expect(dag.roots).to.deep.equal({
//             [index3]: node3
//         });
//         expect(dag.leafs).to.deep.equal({
//             [index1]: node1
//         });
//         expect(node1.outgoingNames.length).to.equal(0);
//         expect(node1.incomingNames.length).to.equal(1);

//         expect(node2.outgoingNames.length).to.equal(1);
//         expect(node2.incomingNames.length).to.equal(1);

//         expect(node3.outgoingNames.length).to.equal(1);
//         expect(node3.incomingNames.length).to.equal(0);

//         VarDAGDefineNodeDeps.clear_node_deps(node3, dag);

//         expect(dag.nodes_names.length).to.equal(1);
//         expect(dag.nodes_names).to.deep.equal([index3]);
//         expect(dag.roots).to.deep.equal({
//             [index3]: node3
//         });
//         expect(dag.leafs).to.deep.equal({
//             [index3]: node3
//         });
//         expect(node3.outgoingNames.length).to.equal(0);
//         expect(node3.incomingNames.length).to.equal(0);
//     });

//     it('test add_node_deps', () => {

//         VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

//         let index1: string = "1_2019-01-01_1_1";
//         let index2: string = "1_2019-01-02_1_1";
//         let index3: string = "1_2019-01-03_1_1";

//         VarDAGDefineNodeDeps.add_node_deps(null, null, null, null);

//         let param1: FakeDataVO = VarDataBaseVO.createNew('fake_type', 1, true, [RangeHandler.getInstance().create_single_elt_TSRange(moment("2019-01-01").utc(true), TimeSegment.TYPE_DAY)]);
//         let param2: FakeDataVO = VarDataBaseVO.createNew('fake_type', 1, true, [RangeHandler.getInstance().create_single_elt_TSRange(moment("2019-01-02").utc(true), TimeSegment.TYPE_DAY)]);
//         let param3: FakeDataVO = VarDataBaseVO.createNew('fake_type', 1, true, [RangeHandler.getInstance().create_single_elt_TSRange(moment("2019-01-03").utc(true), TimeSegment.TYPE_DAY)]);

//         let dag = new VarDAG((name: string, d: VarDAG, param: IVarDataVOBase) => new VarDAGNode(name, d, param), null);

//         // let node1 = dag.add(index1, node_param1);
//         // let node2 = dag.add(index2, node_param2);
//         let node3 = dag.add(index3, param3);

//         let new_nodes: { [index: string]: VarDAGNode } = {};

//         VarDAGDefineNodeDeps.add_node_deps(node3, dag, [param2], new_nodes);

//         expect(new_nodes[index2].param).to.deep.equal(param2);
//         let node2 = dag.nodes[index2];

//         expect(dag.nodes_names.length).to.equal(2);
//         expect(dag.nodes_names).to.deep.equal([index3, index2]);
//         expect(dag.roots[index3]).to.deep.equal(node3);
//         expect(dag.leafs[index2]).to.deep.equal(node2);
//         expect(node2.outgoingNames.length).to.equal(0);
//         expect(node2.incomingNames.length).to.equal(1);

//         expect(node3.outgoingNames.length).to.equal(1);
//         expect(node3.incomingNames.length).to.equal(0);

//         VarDAGDefineNodeDeps.add_node_deps(node2, dag, [param1], new_nodes);
//         expect(new_nodes[index1].param).to.deep.equal(param1);
//         let node1 = dag.nodes[index1];

//         expect(dag.nodes_names.length).to.equal(3);
//         expect(dag.nodes_names).to.deep.equal([index3, index2, index1]);
//         expect(dag.roots[index3]).to.deep.equal(node3);
//         expect(dag.leafs[index1]).to.deep.equal(node1);
//         expect(node1.outgoingNames.length).to.equal(0);
//         expect(node1.incomingNames.length).to.equal(1);

//         expect(node2.outgoingNames.length).to.equal(1);
//         expect(node2.incomingNames.length).to.equal(1);

//         expect(node3.outgoingNames.length).to.equal(1);
//         expect(node3.incomingNames.length).to.equal(0);
//     });
// });