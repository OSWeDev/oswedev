import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import IStoreModule from '../../../store/IStoreModule';

export type VarContext = ActionContext<IVarState, any>;

export interface IVarState {
    desc_mode: boolean;
    desc_selected_var_param: VarDataBaseVO;
    desc_selected_var_param_historic: VarDataBaseVO[];
    desc_deps_opened: boolean;
    desc_registrations_opened: boolean;
    desc_funcstats_opened: boolean;
    desc_selected_var_param_historic_i: number;
}



export default class VarStore implements IStoreModule<IVarState, VarContext> {

    public static getInstance(): VarStore {
        if (!VarStore.instance) {
            VarStore.instance = new VarStore();
        }
        return VarStore.instance;
    }

    private static instance: VarStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IVarState, VarContext>;
    public mutations: MutationTree<IVarState>;
    public actions: ActionTree<IVarState, VarContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "VarStore";


        this.state = {
            desc_mode: false,
            desc_selected_var_param: null,
            desc_selected_var_param_historic_i: -1,
            desc_selected_var_param_historic: [],
            desc_deps_opened: false,
            desc_registrations_opened: false,
            desc_funcstats_opened: false,
        };


        this.getters = {
            isDescDepsOpened(state: IVarState): boolean {
                return state.desc_deps_opened;
            },
            isDescRegistrationsOpened(state: IVarState): boolean {
                return state.desc_registrations_opened;
            },
            isDescFuncStatsOpened(state: IVarState): boolean {
                return state.desc_funcstats_opened;
            },
            isDescMode(state: IVarState): boolean {
                return state.desc_mode;
            },
            getDescSelectedVarParam(state: IVarState): VarDataBaseVO {
                return state.desc_selected_var_param;
            },
            get_desc_selected_var_param_historic(state: IVarState): VarDataBaseVO[] {
                return state.desc_selected_var_param_historic;
            },
            get_desc_selected_var_param_historic_i(state: IVarState): number {
                return state.desc_selected_var_param_historic_i;
            },
        };

        this.mutations = {

            setDescDepsOpened(state: IVarState, desc_deps_opened: boolean) {
                state.desc_deps_opened = desc_deps_opened;
            },

            setDescRegistrationsOpened(state: IVarState, desc_registrations_opened: boolean) {
                state.desc_registrations_opened = desc_registrations_opened;
            },

            setDescFuncStatsOpened(state: IVarState, desc_funcstats_opened: boolean) {
                state.desc_funcstats_opened = desc_funcstats_opened;
            },

            setDescMode(state: IVarState, desc_mode: boolean) {
                state.desc_mode = desc_mode;
            },

            set_desc_selected_var_param_historic_i(state: IVarState, desc_selected_var_param_historic_i: number) {
                state.desc_selected_var_param_historic_i = desc_selected_var_param_historic_i;
            },

            setDescSelectedVarParam(state: IVarState, desc_selected_var_param: VarDataBaseVO) {
                state.desc_selected_var_param = desc_selected_var_param;
                state.desc_deps_opened = false;

                /**
                 * Si on ajoute un élément déjà cohérent avec l'historique, on déplace juste le i
                 * sinon on tronque l'historique et on push la nouvelle var
                 */
                if (state.desc_selected_var_param_historic_i < state.desc_selected_var_param_historic.length - 1) {

                    state.desc_selected_var_param_historic_i++;
                    if (desc_selected_var_param.index == state.desc_selected_var_param_historic[state.desc_selected_var_param_historic_i].index) {
                        return;
                    }

                    state.desc_selected_var_param_historic.splice(
                        state.desc_selected_var_param_historic_i, state.desc_selected_var_param_historic.length - state.desc_selected_var_param_historic_i);
                    state.desc_selected_var_param_historic.push(state.desc_selected_var_param);
                } else {
                    state.desc_selected_var_param_historic.push(state.desc_selected_var_param);
                    state.desc_selected_var_param_historic_i++;
                }
            },
        };



        this.actions = {
            setDescMode(context: VarContext, desc_mode: boolean) {
                commitSetDescMode(context, desc_mode);
            },

            setDescDepsOpened(context: VarContext, desc_deps_opened: boolean) {
                commitSetDescDepsOpened(context, desc_deps_opened);
            },
            setDescRegistrationsOpened(context: VarContext, desc_registrations_opened: boolean) {
                commitSetDescRegistrationsOpened(context, desc_registrations_opened);
            },
            set_desc_selected_var_param_historic_i(context: VarContext, desc_selected_var_param_historic_i: number) {
                commit_set_desc_selected_var_param_historic_i(context, desc_selected_var_param_historic_i);
            },
            setDescFuncStatsOpened(context: VarContext, desc_funcstats_opened: boolean) {
                commitsetDescFuncStatsOpened(context, desc_funcstats_opened);
            },
            setDescSelectedVarParam(context: VarContext, desc_selected_var_param: string) {
                commitSetDescSelectedVarParam(context, desc_selected_var_param);
            },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IVarState, any>("VarStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleVarGetter = namespace('VarStore', Getter);
export const ModuleVarAction = namespace('VarStore', Action);

export const commitSetDescMode = commit(VarStore.getInstance().mutations.setDescMode);
export const commitSetDescRegistrationsOpened = commit(VarStore.getInstance().mutations.setDescRegistrationsOpened);
export const commitsetDescFuncStatsOpened = commit(VarStore.getInstance().mutations.setDescFuncStatsOpened);
export const commitSetDescDepsOpened = commit(VarStore.getInstance().mutations.setDescDepsOpened);
export const commitSetDescSelectedVarParam = commit(VarStore.getInstance().mutations.setDescSelectedVarParam);
export const commit_set_desc_selected_var_param_historic_i = commit(VarStore.getInstance().mutations.set_desc_selected_var_param_historic_i);