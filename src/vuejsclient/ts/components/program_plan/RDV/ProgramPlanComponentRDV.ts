import * as $ from 'jquery';
import { Component, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import ProgramPlanControllerBase from '../ProgramPlanControllerBase';

@Component({
    template: require('./ProgramPlanComponentRDV.pug')
})
export default class ProgramPlanComponentRDV extends VueComponentBase {

    @Prop()
    private target: IPlanTarget;
    @Prop()
    private enseigne: IPlanEnseigne;

    private mounted() {

        // store data so the calendar knows to render an event upon drop
        let event: any = {};

        event.title = this.target.name;
        event.ba_id = this.target.id;

        event.allDay = false;
        event.editable = true;

        event.rdvpris = false;

        event.stick = true; // maintain when user navigates (see docs on the renderEvent method)

        ProgramPlanControllerBase.getInstance().populateDroppableItem(event, $(this.$el));

        $(this.$el).data('event', event);

        // make the event draggable using jQuery UI
        $(this.$el).draggable({
            zIndex: 10000,
            revert: true, // will cause the event to go back to its
            revertDuration: 0 //  original position after the drag
        });
    }
}