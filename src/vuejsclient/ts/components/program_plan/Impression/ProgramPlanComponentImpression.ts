import * as $ from 'jquery';
import * as moment from 'moment';
import select2 from '../../../directives/select2/select2';
import { Component, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import IPlanFacilitator from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import ProgramPlanControllerBase from '../ProgramPlanControllerBase';

@Component({
    template: require('./ProgramPlanComponentImpression.pug'),
    directives: {
        select2: select2
    }
})
export default class ProgramPlanComponentImpression extends VueComponentBase {

    @Prop()
    private enseignes: IPlanEnseigne[];
    @Prop()
    private targets: IPlanTarget[];
    @Prop()
    private facilitators: IPlanFacilitator[];
    @Prop()
    private rdvs: IPlanRDV[];

    private printform_filter_date_debut = moment().day(1).format("Y-MM-DD");
    private printform_filter_date_fin = moment().day(1).add(6, 'days').format("Y-MM-DD");
    private printform_filter_enseignes = [];
    private printform_filter_slotsize = false;
    private printform_filter_clientformat = true;


    private printable_table_weeks = {};

    private printPlanning() {
        this.printable_table_weeks = this.get_printable_table_weeks();
        this.$nextTick(function () {
            window['print']();
        });
    }

    private get_printable_table_days(date_debut, date_fin) {
        let res = [];

        let d = moment(date_debut);

        while (d <= moment(date_fin)) {

            res.push(d.format('DD/MM'));
            d.add(1, 'days');
        }

        return res;
    }

    private get_printable_table_weeks() {
        let res = [];

        let date_debut = moment(this.printform_filter_date_debut).day() == 1 ? moment(this.printform_filter_date_debut) : moment(this.printform_filter_date_debut).day(1);
        let date_fin = moment(this.printform_filter_date_fin).day() == 0 ? moment(this.printform_filter_date_fin) : moment(this.printform_filter_date_fin).day(7);

        let d = moment(date_debut);

        let week_begin = moment(d);
        let week_end = moment(d).add(6, 'days');

        let week: any = {};
        week.days = this.get_printable_table_days(week_begin, week_end);
        week.rows = this.printform_filter_clientformat ? this.get_printable_table_rows_clientformat(week_begin, week_end) : this.get_printable_table_rows(week_begin, week_end);
        res.push(week);
        d.add(7, 'days');

        while (d <= moment(date_fin)) {


            week_begin = moment(d);
            week_end = moment(d).add(6, 'days');

            let week: any = {};
            week.days = this.get_printable_table_days(week_begin, week_end);
            week.rows = this.printform_filter_clientformat ? this.get_printable_table_rows_clientformat(week_begin, week_end) : this.get_printable_table_rows(week_begin, week_end);
            res.push(week);

            d.add(7, 'days');
        }
        return res;
    }

    private get_printable_table_rows(date_debut, date_fin) {
        let res = [];

        for (let i in this.facilitators) {
            let datas_animateur = [];
            let facilitator = this.facilitators[i];

            // Remplir le tableau en fonction des dates, à vide.
            /*let date_debut = moment(this.printform_filter_date_debut).day() == 1 ? moment(this.printform_filter_date_debut) : moment(this.printform_filter_date_debut).day(1);
            let date_fin = moment(this.printform_filter_date_fin).day() == 0 ? moment(this.printform_filter_date_fin) : moment(this.printform_filter_date_fin).day(7);
            */

            let d = moment(date_debut);

            let nb_offsets = 0;

            while (d <= moment(date_fin)) {

                // am / pm
                datas_animateur.push({
                    isrdv: false,
                    nb_slots: 1
                });
                datas_animateur.push({
                    isrdv: false,
                    nb_slots: 1
                });
                d.add(1, 'days');
                nb_offsets += 2;
            }

            // Positionner les évènements
            for (let j in this.rdvs) {
                let rdv = this.rdvs[j];

                if (rdv.facilitator_id == facilitator.id) {

                    if (((moment(rdv.start_time) < moment(this.printform_filter_date_fin).add(1, 'days')) &&
                        (moment(rdv.start_time) >= moment(this.printform_filter_date_debut))) ||
                        ((moment(rdv.end_time) <= moment(this.printform_filter_date_fin).add(1, 'days')) &&
                            (moment(rdv.end_time) > moment(this.printform_filter_date_debut)))) {

                        if (this.printform_filter_enseignes && this.printform_filter_enseignes.length > 0) {
                            let is_enseigne_ok = false;
                            for (let ei in this.printform_filter_enseignes) {
                                let printform_filter_enseigne = this.printform_filter_enseignes[ei];

                                if (printform_filter_enseigne == this.targets[rdv.target_id].enseigne_id) {
                                    is_enseigne_ok = true;
                                }
                            }
                            if (!is_enseigne_ok) {
                                continue;
                            }
                        }

                        // Calculer l'index
                        let offset_start = moment(rdv.start_time).diff(moment(date_debut), 'hours');
                        let offset_start_halfdays = Math.round(offset_start / 12);

                        if (offset_start_halfdays < 0) {
                            offset_start_halfdays = 0;
                        }

                        let offset_end = moment(rdv.end_time).diff(moment(date_debut), 'hours');
                        let offset_end_halfdays = Math.round(offset_end / 12);

                        if (offset_end_halfdays >= nb_offsets) {
                            offset_end_halfdays = nb_offsets - 1;
                        }

                        if ((offset_end_halfdays - offset_start_halfdays) < 0) {
                            continue;
                        }

                        datas_animateur[offset_start_halfdays] = {
                            isrdv: true,
                            nb_slots: (offset_end_halfdays - offset_start_halfdays),
                            short_name: this.targets[rdv.target_id].name
                        };

                        ProgramPlanControllerBase.getInstance().populateCalendarEvent(datas_animateur[offset_start_halfdays]);
                    }
                }
            }

            // Regrouper les evenements et les cases vides
            let res_datas_animateur = [];
            let ignore_next_indexes = 0;
            let combine = 0;
            let last_res_data = null;

            // Les lignes vides ne sont pas imprimées
            let emptyrow = true;

            for (let k in datas_animateur) {
                let data_animateur = datas_animateur[k];

                if (ignore_next_indexes) {
                    ignore_next_indexes--;
                    continue;
                }

                if (last_res_data && (!last_res_data.isrdv) && (!data_animateur.isrdv)) {
                    last_res_data.nb_slots++;
                    continue;
                }

                last_res_data = {
                    isrdv: data_animateur.isrdv,
                    nb_slots: data_animateur.nb_slots,
                    color: data_animateur.color,
                    bgcolor: data_animateur.bgcolor,
                    short_name: data_animateur.short_name
                };

                if (data_animateur.isrdv) {
                    emptyrow = false;
                }

                res_datas_animateur.push(last_res_data);

                if (data_animateur.nb_slots > 1) {
                    ignore_next_indexes = data_animateur.nb_slots - 1;
                }
            }

            if (!emptyrow) {
                res.push(res_datas_animateur);
            }
        }

        return res;
    }

    private get_printable_table_rows_clientformat(date_debut, date_fin) {
        let res;

        let rows_number = 20;
        let unplacedEvents: IPlanRDV[] = null;
        let hasUnplacedEvents = true;

        let events: IPlanRDV[] = $.extend({}, this.rdvs);

        for (let j in events) {
            let rdv: IPlanRDV = events[j];

            if (!(((moment(rdv.start_time) < moment(this.printform_filter_date_fin).add(1, 'days')) &&
                (moment(rdv.start_time) >= moment(this.printform_filter_date_debut))) ||
                ((moment(rdv.end_time) <= moment(this.printform_filter_date_fin).add(1, 'days')) &&
                    (moment(rdv.end_time) > moment(this.printform_filter_date_debut))))) {
                delete events[rdv.id];
                continue;
            }

            if ((!this.targets[rdv.target_id]) || (!this.enseignes[this.targets[rdv.target_id].enseigne_id])) {
                delete events[rdv.id];
                continue;
            }

            if (this.printform_filter_enseignes && this.printform_filter_enseignes.length > 0) {
                let is_enseigne_ok = false;
                for (let ei in this.printform_filter_enseignes) {
                    let printform_filter_enseigne = this.printform_filter_enseignes[ei];

                    if (printform_filter_enseigne == this.targets[rdv.target_id].enseigne_id) {
                        is_enseigne_ok = true;
                    }
                }
                if (!is_enseigne_ok) {
                    delete events[rdv.id];
                    continue;
                }
            }
        }

        while (events && hasUnplacedEvents) {
            rows_number++;
            res = [];

            unplacedEvents = $.extend({}, events);

            for (let i = 0; i < rows_number; i++) {
                let datas_row = [];

                let d = moment(date_debut);

                let nb_offsets = 0;

                while (d <= moment(date_fin)) {

                    // am / pm
                    if (this.printform_filter_slotsize) {

                        datas_row.push({
                            isrdv: false,
                            nb_slots: 1
                        });
                        nb_offsets++;
                    }
                    datas_row.push({
                        isrdv: false,
                        nb_slots: (this.printform_filter_slotsize ? 1 : 2)
                    });
                    d.add(1, 'days');
                    nb_offsets++;
                }

                // Positionner les évènements
                let events: IPlanRDV[] = $.extend({}, unplacedEvents);
                hasUnplacedEvents = false;
                for (let j in events) {
                    let animation_rdv = events[j];

                    // Calculer l'index
                    let offset_start = moment(animation_rdv.start_time).diff(moment(date_debut), 'hours');
                    let offset_start_halfdays = Math.floor(offset_start / (this.printform_filter_slotsize ? 12 : 24));

                    if (offset_start_halfdays < 0) {
                        offset_start_halfdays = 0;
                    }

                    let offset_end = moment(animation_rdv.end_time).diff(moment(date_debut), 'hours');
                    let offset_end_halfdays = Math.ceil(offset_end / (this.printform_filter_slotsize ? 12 : 24));

                    if (offset_end_halfdays >= nb_offsets) {
                        offset_end_halfdays = nb_offsets - 1;
                    }

                    if ((offset_end_halfdays - offset_start_halfdays) < 0) {
                        delete unplacedEvents[animation_rdv.id];
                        continue;
                    }

                    // Dernier check, est-ce que cette ligne est déjà occupée par un évènement qui rentre en conflit
                    // On part de la première case de la ligne et on regarde toutes les cases jusqu'au bout de l'évènement pour savoir si il y a conflit
                    let inevent_slots = 0;
                    let is_compatible = true;
                    for (let offset = 0; offset < offset_end; offset++) {

                        // Pas ok si :
                        //  Event sur cette case et offset >= offset_start && offset < offset_end
                        //  En cours d'event (nb_slots d'un event précédent) et offset >= offset_start && offset < offset_end
                        let is_in_event = false;
                        if (inevent_slots) {
                            is_in_event = true;
                            inevent_slots -= (this.printform_filter_slotsize ? 1 : 2);
                        }

                        if (datas_row[offset] && datas_row[offset].isrdv) {
                            is_in_event = true;
                            inevent_slots = datas_row[offset].nb_slots - (this.printform_filter_slotsize ? 1 : 2);
                        }

                        if (is_in_event && (offset >= offset_start_halfdays) && (offset < offset_end_halfdays)) {
                            is_compatible = false;
                            break;
                        }
                    }
                    if (!is_compatible) {
                        hasUnplacedEvents = true;
                        continue;
                    }

                    delete unplacedEvents[animation_rdv.id];

                    datas_row[offset_start_halfdays] = {
                        isrdv: true,
                        nb_slots: (this.printform_filter_slotsize ? (offset_end_halfdays - offset_start_halfdays) : ((offset_end_halfdays - offset_start_halfdays) * 2)),
                        short_name: this.targets[animation_rdv.target_id].name
                    };
                    ProgramPlanControllerBase.getInstance().populateCalendarEvent(datas_row[offset_start_halfdays]);
                }

                // Regrouper les evenements et les cases vides
                let res_datas_row = [];
                let ignore_next_indexes = 0;
                let combine = 0;
                let last_res_data = null;

                // Les lignes vides ne sont pas imprimées
                let emptyrow = true;

                for (let k in datas_row) {
                    let data_row = datas_row[k];

                    if (ignore_next_indexes > 0) {
                        ignore_next_indexes -= data_row.nb_slots;
                        continue;
                    }

                    if (last_res_data && (!last_res_data.isrdv) && (!data_row.isrdv)) {
                        last_res_data.nb_slots += data_row.nb_slots;
                        continue;
                    }

                    last_res_data = {
                        isrdv: data_row.isrdv,
                        nb_slots: data_row.nb_slots,
                        color: data_row.color,
                        bgcolor: data_row.bgcolor,
                        short_name: data_row.short_name
                    };

                    if (data_row.isrdv) {
                        emptyrow = false;
                    }

                    res_datas_row.push(last_res_data);

                    if (data_row.nb_slots > (this.printform_filter_slotsize ? 1 : 2)) {
                        ignore_next_indexes = data_row.nb_slots - (this.printform_filter_slotsize ? 1 : 2);
                    }
                }

                if (!emptyrow) {
                    res.push(res_datas_row);
                }
            }
        }

        return res;
    }
}