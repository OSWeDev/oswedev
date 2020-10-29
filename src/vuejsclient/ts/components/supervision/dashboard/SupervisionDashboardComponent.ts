import Component from 'vue-class-component';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ISupervisedItem from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import SupervisionDashboardItemComponent from './item/SupervisionDashboardItemComponent';
import './SupervisionDashboardComponent.scss';
import { ModuleSupervisionGetter } from './SupervisionDashboardStore';
import SupervisionDashboardWidgetComponent from './widget/SupervisionDashboardWidgetComponent';

@Component({
    template: require('./SupervisionDashboardComponent.pug'),
    components: {
        Supervisiondashboardwidgetcomponent: SupervisionDashboardWidgetComponent,
        Supervisiondashboarditemcomponent: SupervisionDashboardItemComponent
    }
})
export default class SupervisionDashboardComponent extends VueComponentBase {

    @ModuleSupervisionGetter
    private get_show_errors: boolean;
    @ModuleSupervisionGetter
    private get_show_errors_read: boolean;
    @ModuleSupervisionGetter
    private get_show_warns: boolean;
    @ModuleSupervisionGetter
    private get_show_warns_read: boolean;
    @ModuleSupervisionGetter
    private get_show_oks: boolean;
    @ModuleSupervisionGetter
    private get_show_pauseds: boolean;
    @ModuleSupervisionGetter
    private get_show_unknowns: boolean;

    private supervised_items_by_names: { [name: string]: ISupervisedItem } = {};
    private continue_reloading: boolean = true;

    private categorys: SupervisedCategoryVO[] = null;
    private selected_category: SupervisedCategoryVO = null;

    private api_type_ids: string[] = [];
    private api_type_ids_by_category_ids: { [id: number]: string[] } = {};
    private selected_api_type_id: string = null;

    private async mounted() {

        this.continue_reloading = true;
        await this.load_supervised_items_and_continue(true);
    }

    private async beforeDestroy() {
        this.continue_reloading = false;
    }

    private async load_supervised_items_and_continue(first_build: boolean = false) {
        if (!this.continue_reloading) {
            return;
        }

        await this.load_supervised_items(first_build);
        setTimeout(this.load_supervised_items_and_continue.bind(this), 20000);

    }

    private async load_supervised_items(first_build: boolean) {

        let new_supervised_items_by_names: { [name: string]: ISupervisedItem } = {};
        let promises = [];

        let already_add_api_type_ids_by_category_ids: { [id: number]: { [api_type_id: string]: boolean } } = {};

        for (let api_type_id in SupervisionController.getInstance().registered_controllers) {

            if (first_build) {
                this.api_type_ids.push(api_type_id);
            }

            promises.push((async () => {
                let items = await ModuleDAO.getInstance().getVos<ISupervisedItem>(api_type_id);

                for (let i in items) {
                    let item = items[i];

                    new_supervised_items_by_names[item.name] = item;

                    if (first_build) {
                        if (item.category_id) {
                            if (!this.api_type_ids_by_category_ids[item.category_id]) {
                                this.api_type_ids_by_category_ids[item.category_id] = [];
                            }

                            if (!already_add_api_type_ids_by_category_ids[item.category_id]) {
                                already_add_api_type_ids_by_category_ids[item.category_id] = {};
                            }

                            if (!already_add_api_type_ids_by_category_ids[item.category_id][item._type]) {
                                already_add_api_type_ids_by_category_ids[item.category_id][item._type] = true;
                                this.api_type_ids_by_category_ids[item.category_id].push(item._type);
                            }
                        }
                    }
                }
            })());
        }

        promises.push((async () => this.categorys = await ModuleDAO.getInstance().getVos<SupervisedCategoryVO>(SupervisedCategoryVO.API_TYPE_ID))());

        await Promise.all(promises);

        this.supervised_items_by_names = new_supervised_items_by_names;
    }

    private selectCategory(category: SupervisedCategoryVO) {
        this.selected_category = category;
        this.selected_api_type_id = null;
    }

    private selectApiTypeId(api_type_id: string) {
        this.selected_api_type_id = api_type_id;
    }

    get nb_errors(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_ERROR) {
                let is_ok: boolean = true;

                // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
                if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                    is_ok = false;
                }

                // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
                if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                    is_ok = false;
                }

                if (is_ok) {
                    res++;
                }
            }
        }

        return res;
    }

    get nb_warns(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_WARN) {
                let is_ok: boolean = true;

                // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
                if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                    is_ok = false;
                }

                // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
                if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                    is_ok = false;
                }

                if (is_ok) {
                    res++;
                }
            }
        }

        return res;
    }

    get nb_oks(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_OK) {
                let is_ok: boolean = true;

                // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
                if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                    is_ok = false;
                }

                // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
                if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                    is_ok = false;
                }

                if (is_ok) {
                    res++;
                }
            }
        }

        return res;
    }

    get nb_pauses(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_PAUSED) {
                let is_ok: boolean = true;

                // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
                if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                    is_ok = false;
                }

                // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
                if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                    is_ok = false;
                }

                if (is_ok) {
                    res++;
                }
            }
        }

        return res;
    }

    get nb_errors_read(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_ERROR_READ) {
                let is_ok: boolean = true;

                // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
                if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                    is_ok = false;
                }

                // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
                if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                    is_ok = false;
                }

                if (is_ok) {
                    res++;
                }
            }
        }

        return res;
    }

    get nb_warns_read(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_WARN_READ) {
                let is_ok: boolean = true;

                // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
                if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                    is_ok = false;
                }

                // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
                if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                    is_ok = false;
                }

                if (is_ok) {
                    res++;
                }
            }
        }

        return res;
    }

    get nb_unknowns(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_UNKOWN) {
                let is_ok: boolean = true;

                // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
                if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                    is_ok = false;
                }

                // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
                if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                    is_ok = false;
                }

                if (is_ok) {
                    res++;
                }
            }
        }

        return res;
    }

    get ordered_supervised_items(): ISupervisedItem[] {
        let res: ISupervisedItem[] = [];
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            switch (supervised_item.state) {
                case SupervisionController.STATE_ERROR:
                    if (!this.get_show_errors) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_ERROR_READ:
                    if (!this.get_show_errors_read) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_OK:
                    if (!this.get_show_oks) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_PAUSED:
                    if (!this.get_show_pauseds) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_UNKOWN:
                    if (!this.get_show_unknowns) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_WARN:
                    if (!this.get_show_warns) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_WARN_READ:
                    if (!this.get_show_warns_read) {
                        continue;
                    }
                    break;
            }

            let is_ok: boolean = true;

            // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
            if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                is_ok = false;
            }

            // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
            if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                is_ok = false;
            }

            if (is_ok) {
                res.push(supervised_item);
            }
        }

        res.sort((a: ISupervisedItem, b: ISupervisedItem) => {

            if (a.state < b.state) {
                return -1;
            }

            if (a.state > b.state) {
                return 1;
            }

            if (a.last_update && ((!b.last_update) || a.last_update.isBefore(b.last_update))) {
                return -1;
            }

            if (b.last_update && ((!a.last_update) || b.last_update.isBefore(a.last_update))) {
                return 1;
            }

            if (a.name < b.name) {
                return -1;
            }

            if (a.name > b.name) {
                return 1;
            }

            return 0;
        });

        return res;
    }

    get filtered_api_type_ids(): string[] {
        if (!this.api_type_ids) {
            return this.api_type_ids;
        }

        if (!this.selected_category) {
            return this.api_type_ids;
        }

        return this.api_type_ids_by_category_ids[this.selected_category.id];
    }
}