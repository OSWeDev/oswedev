import * as moment from 'moment';
import { Moment } from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import SimpleDatatableField from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VueComponentBase from '../VueComponentBase';

@Component({
    template: require('./TSRangesInputComponent.pug'),
    components: {}
})
export default class TSRangesInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: null })
    private value: TSRange[];

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private selectedDates: Date[] = [];

    private new_value: TSRange[] = null;

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {
        if (RangeHandler.getInstance().are_same(this.new_value, this.value)) {
            return;
        }


        this.new_value = this.value;
        this.selectedDates = [];

        if (!this.value) {
            return;
        }

        RangeHandler.getInstance().foreach_ranges_sync(this.value, (e: Moment) => {
            // On met UTC false car le composant v-date-picker utilise sans UTC et il compare directement la date
            // Ca pose donc un soucis de comparaison pour v-date-picker
            // Il faut bien laisser utc(false)
            this.selectedDates.push(moment(e.format('Y-MM-DD')).utc(false).toDate());
        }, this.field.moduleTableField.segmentation_type);
    }

    @Watch('selectedDates')
    private emitInput(): void {

        this.new_value = [];
        for (let i in this.selectedDates) {
            let selectedDate = this.selectedDates[i];

            this.new_value.push(RangeHandler.getInstance().create_single_elt_TSRange(moment(selectedDate).utc(true), this.field.moduleTableField.segmentation_type));
        }
        this.new_value = RangeHandler.getInstance().getRangesUnion(this.new_value);
        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }

    get disabled_dates(): any {
        if (!this.disabled) {
            return null;
        }

        return {
            weekdays: [1, 2, 3, 4, 5, 6, 7]
        };
    }
}