import * as moment from "moment";
import { unitOfTime } from "moment";
import * as screenfull from "screenfull";
import { Vue } from "vue-property-decorator";
import ModuleDataExport from "../../../shared/modules/DataExport/ModuleDataExport";
import ExportDataToXLSXParamVO from "../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO";
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleFormatDatesNombres from "../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres";
import Module from "../../../shared/modules/Module";
import ModulesManager from "../../../shared/modules/ModulesManager";
import DefaultTranslation from "../../../shared/modules/Translation/vos/DefaultTranslation";
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import CRUDHandler from '../../../shared/tools/CRUDHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import { alerteCheckFilter, amountFilter, bignumFilter, booleanFilter, hideZeroFilter, hourFilter, padHourFilter, percentFilter, planningCheckFilter, toFixedCeilFilter, toFixedFilter, toFixedFloorFilter, truncateFilter } from '../../../shared/tools/Filters';
import LocaleManager from "../../../shared/tools/LocaleManager";
import VocusHandler from '../../../shared/tools/VocusHandler';
import VueAppController from "../../VueAppController";
import AjaxCacheClientController from "../modules/AjaxCache/AjaxCacheClientController";
import AppVuexStoreManager from "../store/AppVuexStoreManager";
import IDeclareVueComponent from "./IDeclareVueComponent";

// MONTHS MIXIN
let months = [
    "label.month.janvier",
    "label.month.fevrier",
    "label.month.mars",
    "label.month.avril",
    "label.month.mai",
    "label.month.juin",
    "label.month.juillet",
    "label.month.aout",
    "label.month.septembre",
    "label.month.octobre",
    "label.month.novembre",
    "label.month.decembre"
];

let days = [
    "label.day.dimanche",
    "label.day.lundi",
    "label.day.mardi",
    "label.day.mercredi",
    "label.day.jeudi",
    "label.day.vendredi",
    "label.day.samedi"
];

export function FiltersHandler() {
    this.filter_amount = false;
    this.filter_amount_n = undefined;
    this.filter_amount_k = undefined;
    this.filter_percent = false;
    this.filter_percent_n = undefined;
    this.filter_percent_pts = undefined;
    this.filter_toFixed = false;
    this.filter_toFixed_n = undefined;
    this.filter_hideZero = false;
    this.filter_bignum = false;
    this.filter_truncate = false;
    this.filter_truncate_n = undefined;
    this.filter_boolean = false;
    this.filter_padHour = false;
    this.filter_padHour_n = undefined;
    this.filter_hour = false;
    this.filter_hour_arrondi = false;
    this.filter_hour_negative = false;
    this.filter_hour_positive_sign = false;
    this.filter_hour_formatted = false;
    this.filter_hour_arrondi_minutes = false;
    this.filter_planningCheck = false;
    this.filter_alerteCheck = false;
    this.filter_hourAndMinutesFilter = false;

    this.setAmountFilter = function (active = true, n = undefined, k = undefined) {
        this.filter_amount = active;
        this.filter_amount_n = n;
        this.filter_amount_k = k;
        return this;
    };
    this.setPercentFilter = function (
        active = true,
        n = undefined,
        pts = undefined
    ) {
        this.filter_percent = active;
        this.filter_percent_n = n;
        this.filter_percent_pts = pts;
        return this;
    };
    this.setToFixedFilter = function (active = true, n = undefined) {
        this.filter_toFixed = active;
        this.filter_toFixed_n = n;
        return this;
    };
    this.setToFixedCeilFilter = function (active = true, n = undefined) {
        this.filter_toFixedCeil = active;
        this.filter_toFixed_n = n;
        return this;
    };
    this.setToFixedFloorFilter = function (active = true, n = undefined) {
        this.filter_toFixedFloor = active;
        this.filter_toFixed_n = n;
        return this;
    };
    this.setHideZeroFilter = function (active = true) {
        this.filter_hideZero = active;
        return this;
    };
    this.setBigNumFilter = function (active = true, n = undefined) {
        this.filter_bignum = active;
        return this;
    };
    this.setTruncateFilter = function (active = true, n = undefined) {
        this.filter_truncate = active;
        this.filter_truncate_n = n;
        return this;
    };
    this.setBooleanFilter = function (active = true) {
        this.filter_boolean = active;
        return this;
    };
    this.setPadHourFilter = function (active = true, n = undefined) {
        this.filter_padHour = active;
        this.filter_padHour_n = n;
        return this;
    };
    this.setHourFilter = function (
        active = true,
        arrondi = false,
        negative = false,
        positiveSign = false,
        formatted = false,
        arrondi_minutes = false
    ) {
        this.filter_hour = active;
        this.filter_hour_arrondi = arrondi;
        this.filter_hour_negative = negative;
        this.filter_hour_positive_sign = positiveSign;
        this.filter_hour_formatted = formatted;
        this.filter_hour_arrondi_minutes = arrondi_minutes;
        return this;
    };
    this.setPlanningCheckFilter = function (active = true) {
        this.filter_planningCheck = active;
        return this;
    };
    this.setAlerteCheckFilter = function (active = true) {
        this.filter_alerteCheck = active;
        return this;
    };
    this.setHourAndMinutesFilter = function (active = true) {
        this.filter_hourAndMinutesFilter = active;
        return this;
    };

    this.applyWrite = function (value) {
        if (this.filter_amount) {
            value = amountFilter.write(value);
        }
        if (this.filter_percent) {
            value = percentFilter.write(value);
        }
        if (this.filter_toFixed) {
            value = toFixedFilter.write(value);
        }
        if (this.filter_toFixedCeil) {
            value = toFixedCeilFilter.write(value);
        }
        if (this.filter_toFixedFloor) {
            value = toFixedFloorFilter.write(value);
        }
        if (this.filter_hideZero) {
            value = hideZeroFilter.write(value);
        }
        if (this.filter_boolean) {
            value = booleanFilter.write(value);
        }
        if (this.filter_padHour) {
            value = padHourFilter.write(value);
        }
        if (this.filter_truncate) {
            value = truncateFilter.write(value);
        }
        if (this.filter_bignum) {
            value = bignumFilter.write(value);
        }
        if (this.filter_hour) {
            value = hourFilter.write(value);
        }
        if (this.filter_planningCheck) {
            value = planningCheckFilter.write(value);
        }
        if (this.filter_alerteCheck) {
            value = alerteCheckFilter.write(value);
        }
        return value;
    };

    this.applyRead = function (value) {
        if (this.filter_amount) {
            value = amountFilter.read(
                value,
                this.filter_amount_n,
                this.filter_amount_k
            );
        }
        if (this.filter_percent) {
            value = percentFilter.read(
                value,
                this.filter_percent_n,
                this.filter_percent_pts
            );
        }
        if (this.filter_toFixed) {
            value = toFixedFilter.read(value, this.filter_toFixed_n);
        }
        if (this.filter_toFixedCeil) {
            value = toFixedCeilFilter.read(value, this.filter_toFixed_n);
        }
        if (this.filter_toFixedFloor) {
            value = toFixedFloorFilter.read(value, this.filter_toFixed_n);
        }
        if (this.filter_hideZero) {
            value = hideZeroFilter.read(value);
        }
        if (this.filter_boolean) {
            value = booleanFilter.read(value);
        }
        if (this.filter_padHour) {
            value = padHourFilter.read(value);
        }
        if (this.filter_truncate) {
            value = truncateFilter.read(value, this.filter_truncate_n);
        }
        if (this.filter_bignum) {
            value = bignumFilter.read(value);
        }
        if (this.filter_hour) {
            value = hourFilter.read(
                value,
                this.filter_hour_arrondi,
                this.filter_hour_negative,
                this.filter_hour_positive_sign,
                this.filter_hour_formatted,
                this.filter_hour_arrondi_minutes
            );
        }
        if (this.filter_planningCheck) {
            value = planningCheckFilter.read(value);
        }
        if (this.filter_alerteCheck) {
            value = alerteCheckFilter.read(value);
        }
        return value;
    };
}

export default class VueComponentBase extends Vue
    implements IDeclareVueComponent {

    public static const_filters = {
        amount: amountFilter,
        percent: percentFilter,
        toFixed: toFixedFilter,
        toFixedCeil: toFixedCeilFilter,
        toFixedFloor: toFixedFloorFilter,
        hideZero: hideZeroFilter,
        boolean: booleanFilter,
        padHour: padHourFilter,
        truncate: truncateFilter,
        bignum: bignumFilter,
        hour: hourFilter,
        planningCheck: planningCheckFilter,
        alerteCheck: alerteCheckFilter,
    };

    public $snotify: any;

    public segment_type_rolling_year_month_start: number = TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
    public segment_type_year: number = TimeSegment.TYPE_YEAR;
    public segment_type_month: number = TimeSegment.TYPE_MONTH;
    public segment_type_week: number = TimeSegment.TYPE_WEEK;
    public segment_type_day: number = TimeSegment.TYPE_DAY;

    protected data_user = VueAppController.getInstance().data_user;

    // FILTERS MIXIN
    protected const_filters = {
        amount: amountFilter,
        percent: percentFilter,
        toFixed: toFixedFilter,
        toFixedCeil: toFixedCeilFilter,
        toFixedFloor: toFixedFloorFilter,
        hideZero: hideZeroFilter,
        boolean: booleanFilter,
        padHour: padHourFilter,
        truncate: truncateFilter,
        bignum: bignumFilter,
        hour: hourFilter,
        planningCheck: planningCheckFilter,
        alerteCheck: alerteCheckFilter,
    };


    // LOADING MIXIN
    protected isLoading = true;
    protected loadingProgression: number = 0;
    protected nbLoadingSteps: number = 5;

    protected fullscreen = screenfull.isFullscreen;

    // TRANSLATION MIXIN
    public t(txt, params = {}): string {
        if (!txt) {
            return txt;
        }

        if (VueAppController.getInstance().has_access_to_onpage_translation) {
            AppVuexStoreManager.getInstance().appVuexStore.commit('OnPageTranslationStore/registerPageTranslation', {
                translation_code: txt,
                missing: false
            });
        }

        return LocaleManager.getInstance().t(txt, params);
    }

    public label(txt, params = {}): string {
        if (!txt) {
            return txt;
        }
        return this.t(
            txt + DefaultTranslation.DEFAULT_LABEL_EXTENSION,
            params
        );
    }

    protected toggleFullscreen() {
        screenfull.toggle();
    }

    protected onFullscreenChange() {
        this.fullscreen = screenfull.isFullscreen;
    }

    // SNOTIFY
    get snotify() {
        return this.$snotify;
    }

    protected getVocusLink(API_TYPE_ID: string, vo_id: number): string {
        return VocusHandler.getVocusLink(API_TYPE_ID, vo_id);
    }

    protected getCRUDLink(API_TYPE_ID: string): string {
        return CRUDHandler.getCRUDLink(API_TYPE_ID);
    }

    protected getCRUDCreateLink(API_TYPE_ID: string, embed: boolean): string {
        return CRUDHandler.getCreateLink(API_TYPE_ID, embed);
    }

    protected getCRUDUpdateLink(API_TYPE_ID: string, vo_id: number): string {
        return CRUDHandler.getUpdateLink(API_TYPE_ID, vo_id);
    }

    protected getCRUDDeleteLink(API_TYPE_ID: string, vo_id: number): string {
        return CRUDHandler.getDeleteLink(API_TYPE_ID, vo_id);
    }


    // Permet de savoir si un module est actif ou pas
    protected moduleIsActive(nom_module) {
        let module: Module = ModulesManager.getInstance().getModuleByNameAndRole(
            nom_module,
            Module.SharedModuleRoleName
        ) as Module;

        return module && module.actif;
    }

    // Le mixin du module format_dates_nombres
    protected formatDate_MonthDay(dateToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatDate_MonthDay(
                dateToFormat
            );
        }
        return dateToFormat;
    }

    protected formatDate_Fullyear(dateToFormat) {
        if (!dateToFormat) {
            return "";
        }
        return moment(dateToFormat).utc(true).format("YYYY");
    }

    protected formatDate_FullyearMonth(dateToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(
                dateToFormat
            );
        }
        return dateToFormat;
    }

    protected formatDate_FullyearMonthDay(dateToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(
                dateToFormat
            );
        }
        return dateToFormat;
    }

    protected formatNumber_nodecimal(numberToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(
                numberToFormat
            );
        }
        return numberToFormat;
    }

    protected formatNumber_1decimal(numberToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(
                numberToFormat,
                1
            );
        }
        return numberToFormat;
    }

    protected formatNumber_2decimal(numberToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(
                numberToFormat,
                2
            );
        }
        return numberToFormat;
    }

    protected invalidateCache() {
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(
            new RegExp(".*", "i")
        );
    }

    // DATE MIXIN
    protected parseDateWithFormat(date, format = "d-m-y") {
        var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        var month =
            date.getMonth() + 1 < 10
                ? "0" + (date.getMonth() + 1)
                : date.getMonth() + 1;
        var year = date.getFullYear();

        return format
            .replace("d", day)
            .replace("m", month)
            .replace("y", year);
    }

    protected parseDateFR(date, separateur = "-") {
        return (
            (date.getMonth() + 1 < 10
                ? "0" + (date.getMonth() + 1)
                : date.getMonth() + 1) +
            separateur +
            date.getFullYear()
        );
    }
    protected parseDateEN(date) {
        return (
            date.getFullYear() +
            "-" +
            (date.getMonth() + 1 < 10
                ? "0" + (date.getMonth() + 1)
                : date.getMonth() + 1) +
            "-" +
            (date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
        );
    }

    // FILTERS MIXIN
    protected newFilter() {
        return new FiltersHandler();
    }

    // LOADING MIXIN
    protected startLoading() {
        this.isLoading = true;
        this.loadingProgression = 0;
    }
    protected nextLoadingStep() {
        if (this.loadingProgression < 0) {
            this.loadingProgression = 0;
        }
        if (this.loadingProgression >= 100) {
            console.debug("this.loadingProgression > 100");
        }
        this.loadingProgression =
            this.loadingProgression + 100 / this.nbLoadingSteps;
        if (this.loadingProgression > 100) {
            this.loadingProgression = 100;
        }
    }
    protected stopLoading() {
        this.isLoading = false;
        this.loadingProgression = 100;
    }

    // MOMENT MIXIN
    protected getNbWeekInMonth(month) {
        let month_tmp = moment(month).utc(true);
        let res = moment(month_tmp).utc(true)
            .endOf("month")
            .startOf("isoweek" as unitOfTime.StartOf);
        return (
            res.diff(
                moment(month_tmp).utc(true)
                    .startOf("month")
                    .startOf("isoweek" as unitOfTime.StartOf),
                "weeks"
            ) + 1
        );
    }

    // MONTHS MIXIN
    protected getMonthName(month_number) {
        return months[month_number];
    }
    protected getMonthInTexte(month) {
        return this.getMonthName(moment(month).utc(true).get("month"));
    }
    protected getJourInText(jour_iso) {
        return days[jour_iso];
    }

    // MOMENT for .pug usage
    protected moment(...args) {
        return moment(...args);
    }

    // SMALL MIXINS
    protected filterMultiple(x, xs, strict?) {
        return (xs.length == 0 && !strict) || xs.indexOf(x) != -1;
    }

    //EDITION MIXIN
    get editionMode() {
        return AppVuexStoreManager.getInstance().appVuexStore.state.editionMode;
    }

    protected varif_simplenumber_boolean_condition(value: VarDataBaseVO) {
        return (!!value) && (!!value.value);
    }

    protected simple_var_div(values: VarDataBaseVO[]): number {
        if ((!values) || (!values[0]) || (!values[1])) {
            return null;
        }

        if (!values[1].value) {
            return null;
        }

        return values[0].value / values[1].value;
    }

    protected simple_var_add(values: VarDataBaseVO[]): number {
        if ((!values) || (!values.length)) {
            return null;
        }

        let res: number = null;
        for (let i in values) {
            let value = values[i];

            if ((!value) || (value.value == null) || (typeof value.value == 'undefined') || (isNaN(1 + value.value))) {
                continue;
            }

            if (res == null) {
                res = value.value;
            } else {
                res += value.value;
            }
        }

        return res;
    }

    protected simple_var_mean(values: VarDataBaseVO[]): number {
        if ((!values) || (!values.length)) {
            return null;
        }

        let res: number = null;
        let length: number = 0;
        for (let i in values) {
            let value = values[i];

            if ((!value) || (value.value == null) || (typeof value.value == 'undefined') || (isNaN(1 + value.value))) {
                continue;
            }

            if (res == null) {
                res = value.value;
            } else {
                res += value.value;
            }
            length++;
        }

        if (!length) {
            return null;
        }

        return res / length;
    }

    protected simple_var_supp_zero(var_data: VarDataBaseVO): boolean {
        if ((!var_data) || (var_data.value == null) || (typeof var_data.value == 'undefined')) {
            return false;
        }

        return var_data.value > 0;
    }

    protected simple_var_supp_egal_zero(var_data: VarDataBaseVO): boolean {
        if ((!var_data) || (var_data.value == null) || (typeof var_data.value == 'undefined')) {
            return false;
        }

        return var_data.value >= 0;
    }

    protected simple_var_sub(values: VarDataBaseVO[]): number {
        if ((!values) || (!values[0]) || (!values[1])) {
            return null;
        }

        return values[0].value - values[1].value;
    }

    protected simple_var_times(values: VarDataBaseVO[]): number {
        if ((!values) || (!values.length)) {
            return null;
        }

        let res: number = null;
        for (let i in values) {
            let value = values[i];

            if ((!value) || (value.value == null) || (typeof value.value == 'undefined') || (isNaN(1 + value.value))) {
                continue;
            }

            if (res == null) {
                res = value.value;
            } else {
                res *= value.value;
            }
        }

        return res;
    }

    protected simple_var_evolution(datas: VarDataBaseVO[]) {

        try {

            let a: number = datas[0].value;
            let b: number = datas[1].value;

            return b ? (a - b) / b : null;
        } catch (error) {
        }
        return null;
    }

    protected math_round(value: number, decimals: number = 0, convert_to_prct: boolean = false) {

        try {

            if ((value == null) || (typeof value === 'undefined') || (isNaN(value))) {
                return null;
            }

            let decimals_coef = Math.pow(10, decimals);
            let res = value * decimals_coef;

            return Math.round(res) / decimals_coef;
        } catch (error) {
        }
        return null;
    }

    protected math_floor(value: number, decimals: number = 0, convert_to_prct: boolean = false) {

        try {

            if ((value == null) || (typeof value === 'undefined') || (isNaN(value))) {
                return null;
            }

            let decimals_coef = Math.pow(10, decimals);
            let res = value * decimals_coef;

            return Math.floor(res) / decimals_coef;
        } catch (error) {
        }
        return null;
    }

    protected math_ceil(value: number, decimals: number = 0, convert_to_prct: boolean = false) {

        try {

            if ((value == null) || (typeof value === 'undefined') || (isNaN(value))) {
                return null;
            }

            let decimals_coef = Math.pow(10, decimals);
            let res = value * decimals_coef;

            return Math.ceil(res) / decimals_coef;
        } catch (error) {
        }
        return null;
    }

    protected addClassName(className: string, el) {
        if (!el.className) {
            el.className = className;
            return;
        }

        let classes = el.className.split(' ');
        if ((!classes) || (!classes.length)) {
            el.className = className;
            return;
        }

        let found = false;
        for (let i in classes) {
            if (classes[i] == className) {
                found = true;
                return;
            }
        }

        if (!found) {
            el.className += ' ' + className;
        }
    }

    protected removeClassName(className: string, el) {
        if (!el.className) {
            return;
        }

        let classes = el.className.split(' ');
        let res = null;
        for (let i in classes) {

            if (classes[i] == className) {
                continue;
            }

            res = (res ? res + ' ' + classes[i] : classes[i]);
        }
        el.className = (res ? res : '');
    }

    protected on_every_update_simple_number_sign_coloration_handler(varData: VarDataBaseVO, el, binding, vnode) {
        let simple_value = (!!varData) ? ((varData as VarDataBaseVO).value) : null;

        this.removeClassName('text-danger', el);
        this.removeClassName('text-success', el);
        this.removeClassName('text-warning', el);

        let className = (!!simple_value) ?
            ['text-danger', 'text-success'][simple_value > 0 ? 1 : 0] : 'text-warning';

        this.addClassName(className, el);
    }

    protected on_every_update_simple_revert_number_sign_coloration_handler(varData: VarDataBaseVO, el, binding, vnode) {
        let simple_value = (!!varData) ? ((varData as VarDataBaseVO).value) : null;

        this.removeClassName('text-danger', el);
        this.removeClassName('text-success', el);
        this.removeClassName('text-warning', el);

        let className = (!!simple_value) ?
            ['text-danger', 'text-success'][simple_value < 0 ? 1 : 0] : 'text-warning';

        this.addClassName(className, el);
    }

    /**
     * Same as on_every_update_simple_number_sign_coloration_handler but revolves around 1 instead of 0. Used for prcts for example where 100% is the middle value
     * @param varData
     * @param el
     * @param binding
     * @param vnode
     */
    protected on_every_update_simple_number_1_coloration_handler(varData: VarDataBaseVO, el, binding, vnode) {
        let simple_value = (!!varData) ? ((varData as VarDataBaseVO).value) : null;
        simple_value--;

        this.removeClassName('text-danger', el);
        this.removeClassName('text-success', el);
        this.removeClassName('text-warning', el);

        let className = (!!simple_value) ?
            ['text-danger', 'text-success'][simple_value > 0 ? 1 : 0] : 'text-warning';

        this.addClassName(className, el);
    }

    protected on_every_update_simple_prct_supp_egal_100_coloration_handler(varData: VarDataBaseVO, el, binding, vnode) {
        let simple_value = (!!varData) ? ((varData as VarDataBaseVO).value) : null;

        this.removeClassName('text-success', el);

        if ((!!simple_value) && (simple_value > 1)) {
            this.addClassName('text-success', el);
        }
    }

    protected activateEdition() {
        AppVuexStoreManager.getInstance().appVuexStore.commit("activateEdition");
    }
    protected deactivateEdition() {
        AppVuexStoreManager.getInstance().appVuexStore.commit("deactivateEdition");
    }

    get isPrintable(): boolean {
        return AppVuexStoreManager.getInstance().appVuexStore.getters.printable;
    }
    get onprint(): () => void {
        return AppVuexStoreManager.getInstance().appVuexStore.getters.onprint;
    }
    get isExportableToXLSX(): boolean {
        return AppVuexStoreManager.getInstance().appVuexStore.getters.exportableToXLSX;
    }
    get printComponent(): any {
        return AppVuexStoreManager.getInstance().appVuexStore.getters.print_component;
    }

    protected async export_to_xlsx() {
        if (this.isExportableToXLSX) {
            // this.startLoading();
            let param: ExportDataToXLSXParamVO = await AppVuexStoreManager.getInstance().appVuexStore.getters.hook_export_data_to_XLSX();

            if (!!param) {

                await ModuleDataExport.getInstance().exportDataToXLSX(
                    param.filename,
                    param.datas,
                    param.ordered_column_list,
                    param.column_labels,
                    param.api_type_id,
                    param.is_secured,
                    param.file_access_policy_name
                );
            }
            // this.stopLoading();
        }
    }

    protected humanizeDurationTo(date: Date): string {
        return DateHandler.getInstance().humanizeDurationTo(moment(date).utc(true));
    }

    protected routeExists(url: string): boolean {

        let resolved = this['$router'].resolve(url);
        if (resolved.route.name != '404') {
            return true;
        }
        return false;
    }
}
