import { debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleVocus from '../../../../shared/modules/Vocus/ModuleVocus';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../VueComponentBase';
import VocusAdminVueModule from './VocusAdminVueModule';
import './VocusComponent.scss';

@Component({
    template: require('./VocusComponent.pug'),
})
export default class VocusComponent extends VueComponentBase {

    @Prop({ default: null })
    public vo_id: number;

    @Prop({ default: null })
    public vo_type: string;

    private tmp_vo_id: number = null;
    private tmp_vo_type: string = null;

    private refvos: IDistantVOBase[] = [];
    private debounced_load_vocus = debounce(this.load_vocus, 500);

    get vo_types(): string[] {
        return Object.keys(VOsTypesManager.getInstance().moduleTables_by_voType);
    }


    private getlabel(vo: IDistantVOBase) {
        if (!vo) {
            return null;
        }

        let table = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];
        if (table && table.default_label_field) {
            return vo[table.default_label_field.field_id];
        } else if (table && table.table_label_function) {
            return table.table_label_function(vo);
        }
    }

    private get_crud_link(vo: IDistantVOBase) {
        if (!vo) {
            return null;
        }

        return this.getCRUDUpdateLink(vo._type, vo.id);
    }

    private get_vocus_link(vo: IDistantVOBase) {
        if (!vo) {
            return null;
        }

        return this.get_vocus_link_(vo._type, vo.id);
    }

    private get_vocus_link_(_type: string, id: number) {
        if ((!_type) || (!id)) {
            return null;
        }

        return VocusAdminVueModule.ROUTE_PATH + '/' + _type + '/' + id;
    }

    @Watch('vo_id', { immediate: true })
    private async onchange_vo_id() {

        if (this.tmp_vo_id == this.vo_id) {
            return;
        }

        this.tmp_vo_id = this.vo_id;
    }

    @Watch('tmp_vo_id')
    private async onchange_tmp_vo_id() {

        if (this.tmp_vo_id == this.vo_id) {
            return;
        }

        this.$router.push(this.get_vocus_link_(this.tmp_vo_type, this.tmp_vo_id));
    }

    @Watch('vo_type', { immediate: true })
    private async onchange_vo_type() {

        if (this.tmp_vo_type == this.vo_type) {
            return;
        }

        this.tmp_vo_type = this.vo_type;
    }

    @Watch('tmp_vo_type')
    private async onchange_tmp_vo_type() {

        if (this.tmp_vo_type == this.vo_type) {
            return;
        }

        this.$router.push(this.get_vocus_link_(this.tmp_vo_type, this.tmp_vo_id));
    }

    @Watch('$route', { immediate: true })
    private onchange_route() {

        this.debounced_load_vocus();
    }

    private async load_vocus() {

        this.refvos = await ModuleVocus.getInstance().getVosRefsById(this.tmp_vo_type, this.tmp_vo_id);
    }
}