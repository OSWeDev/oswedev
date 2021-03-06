import IDistantVOBase from '../../IDistantVOBase';

export default class DataImportColumnVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "difc";

    public static TYPE_STRING: string = "string";
    public static TYPE_DATE: string = "date";
    public static TYPE_NUMBER: string = "number";
    public static TYPE_NUMBER_COMA_DECIMAL_CSV: string = "number_coma_csv";

    public static createNew(
        title: string, data_import_format_id: number,
        type: string = DataImportColumnVO.TYPE_STRING = DataImportColumnVO.TYPE_STRING): DataImportColumnVO {
        let res: DataImportColumnVO = new DataImportColumnVO();

        res.title = title;
        res.data_import_format_id = data_import_format_id;
        res.type = type;
        res.vo_field_name = title;
        res.other_column_labels = [];
        res.mandatory = false;

        return res;
    }

    public id: number;
    public _type: string = DataImportColumnVO.API_TYPE_ID;

    public column_index: number;
    public vo_field_name: string;
    public mandatory: boolean;
    public other_column_labels: string[];

    public title: string;
    public data_import_format_id: number;
    public type: string;

    /**
     *
     * @param column_index 0 indexed
     * @param title The title as found in the imported file
     * @param vo_field_name The corresponding field_name in the corresponding vo
     * @param data_import_format_id The format this column appears in
     * @param type The column type in the file (in case of data conversions between file and DB)
     */
    public constructor() { }

    public addColumnLabels(column_labels: string[]): DataImportColumnVO {
        this.other_column_labels = this.other_column_labels.concat(column_labels);

        return this;
    }

    public setIndex(column_index: number): DataImportColumnVO {
        this.column_index = column_index;
        return this;
    }

    public setVoFieldName(vo_field_name: string): DataImportColumnVO {
        this.vo_field_name = vo_field_name;
        return this;
    }

    public setMandatory(): DataImportColumnVO {
        this.mandatory = true;
        return this;
    }
}