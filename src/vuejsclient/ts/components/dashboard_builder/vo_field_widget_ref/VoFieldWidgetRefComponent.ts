import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VOFieldRefVO from '../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../VueComponentBase';
import './VoFieldWidgetRefComponent.scss';

@Component({
    template: require('./VoFieldWidgetRefComponent.pug'),
    components: {

    }
})
export default class VoFieldWidgetRefComponent extends VueComponentBase {

    @Prop()
    private vo_field_ref: VOFieldRefVO;


    get field_label(): string {
        if (!this.vo_field_ref) {
            return null;
        }

        if ((!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return null;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);

        return this.t(field.field_label.code_text);
    }

    private remove_field_ref() {
        this.$emit('remove_field_ref', this.vo_field_ref);
    }
}