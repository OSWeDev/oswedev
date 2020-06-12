import ForkMessageController from './ForkMessageController';
import ForkServerController from './ForkServerController';
import MainProcessTaskForkMessage from './messages/MainProcessTaskForkMessage';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';

export default class ForkedTasksController {

    public static getInstance() {
        if (!ForkedTasksController.instance) {
            ForkedTasksController.instance = new ForkedTasksController();
        }
        return ForkedTasksController.instance;
    }

    private static instance: ForkedTasksController = null;

    /**
     * Local thread cache -----
     */
    private registered_tasks: { [task_uid: string]: (...task_params) => Promise<boolean> } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() { }

    get process_registered_tasks(): { [task_uid: string]: (...task_params) => Promise<boolean> } {
        return this.registered_tasks;
    }

    public register_task(task_uid: string, handler: (...task_params) => Promise<boolean>) {
        this.registered_tasks[task_uid] = handler;
    }

    /**
     * Objectif : Exécuter la fonction sur tous les threads, et le plus vite possible (et en synchrone) en local
     *  donc on envoie un message pour tous les autres threads, mais on indique bien que nous c'est fait
     * @param task_uid
     * @param task_params
     */
    public async broadexec(task_uid: string, ...task_params): Promise<boolean> {
        if (!ForkServerController.getInstance().is_main_process) {
            ForkMessageController.getInstance().send(new BroadcastWrapperForkMessage(new MainProcessTaskForkMessage(task_uid, task_params)).except_self());
            return true;
        } else {
            return await ForkMessageController.getInstance().broadcast(new MainProcessTaskForkMessage(task_uid, task_params));
        }
    }

    /**
     * Objectif : Exécuter la fonction sur le thread principal. On envoie la demande au thread maitre si besoin, sinon on exécute directement
     * @param task_uid
     * @param task_params
     */
    public exec_self_on_main_process(task_uid: string, ...task_params): boolean {
        if (!ForkServerController.getInstance().is_main_process) {
            ForkMessageController.getInstance().send(new MainProcessTaskForkMessage(task_uid, task_params));
            return false;
        }
        return true;
    }

    public assert_is_main_process() {
        if (!ForkServerController.getInstance().is_main_process) {
            throw new Error('Should not be called on child process. See exec_async_task_on_main_process.');
        }
    }

    // /**
    //  * Méthode qui permet d'encapsuler l'appel à une méthode pour la réaliser sur le process main
    //  * ATTENTION on attend aucun retour, et on attend pas l'exécution donc on est en asynchrone pur sur ces taches
    //  * @param task_uid Identifiant pour cette fonction, unique parmi les tasks qui passent par des messages
    //  * @param task_handler La méthode cible si on est sur le bon process
    //  * @param task_params Les paramères à appliquer
    //  */
    // public exec_async_task_on_main_process(task_uid: string, ...task_params) {
    //     if (ForkServerController.getInstance().is_main_process) {
    //         this.registered_tasks[task_uid](...task_params);
    //         return;
    //     }

    //     ForkMessageController.getInstance().send(new MainProcessTaskForkMessage(task_uid, task_params));
    // }
}