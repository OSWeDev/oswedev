import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import VueAppBase from '../../../../VueAppBase';
import DatatableField from './DatatableField';

export default abstract class ReferenceDatatableField<Target extends IDistantVOBase> extends DatatableField<number, number> {

    protected constructor(
        type: string,
        datatable_field_uid: string,
        public targetModuleTable: ModuleTable<Target>,
        public sortedTargetFields: Array<DatatableField<any, any>>,
        translatable_title: string = null
    ) {
        super(type, datatable_field_uid, translatable_title);

        for (let i in sortedTargetFields) {
            sortedTargetFields[i].setModuleTable(this.targetModuleTable);
        }

        let self = this;
    }

    public voIdToHumanReadable: (id: number) => string = (id: number) => {
        let res: string = "";

        if (!id) {
            return null;
        }

        let vos = VueAppBase.instance_.vueInstance.$store.getters['DAOStore/getStoredDatas'];
        let data: Target = vos[this.targetModuleTable.vo_type][id];
        return this.dataToHumanReadable(data);
    }

    public dataToHumanReadable: (e: Target) => string = (e: Target) => {
        let res: string = "";

        if (!e) {
            return null;
        }

        for (let i in this.sortedTargetFields) {
            let sortedTargetField = this.sortedTargetFields[i];

            let field_value: string = sortedTargetField.dataToHumanReadableField(e);
            field_value = field_value ? field_value : "";
            res = ((res != "") ? res + " " + field_value : field_value);
        }

        return res as any;
    }

}