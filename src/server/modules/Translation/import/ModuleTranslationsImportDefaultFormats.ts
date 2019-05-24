import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import ModulesManagerServer from '../../ModulesManagerServer';
import ModuleTranslationsImport from '../../../../shared/modules/Translation/import/ModuleTranslationsImport';
import ImportTranslation from '../../../../shared/modules/Translation/import/vos/ImportTranslation';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import DataImportColumnVO from '../../../../shared/modules/DataImport/vos/DataImportColumnVO';

export default class ModuleTranslationsImportDefaultFormats {

    public static getInstance(): ModuleTranslationsImportDefaultFormats {
        if (!ModuleTranslationsImportDefaultFormats.instance) {
            ModuleTranslationsImportDefaultFormats.instance = new ModuleTranslationsImportDefaultFormats();
        }
        return ModuleTranslationsImportDefaultFormats.instance;
    }
    private static instance: ModuleTranslationsImportDefaultFormats = null;

    private constructor() { }

    public async TranslationsImportDefaultFormatLabels() {

        let default_import_format_name: string = 'TranslationsImportDefaultFormatLabels';
        let import_base_data_import_file: DataImportFormatVO = await ModuleDataImport.getInstance().getDataImportFile(default_import_format_name);

        if (import_base_data_import_file) {
            return;
        }

        import_base_data_import_file = new DataImportFormatVO();
        import_base_data_import_file.copy_folder = default_import_format_name;
        import_base_data_import_file.first_row_index = 1;
        import_base_data_import_file.column_labels_row_index = 0;
        import_base_data_import_file.import_uid = default_import_format_name;
        import_base_data_import_file.post_exec_module_id = (await ModulesManagerServer.getInstance().getModuleVOByName(ModuleTranslationsImport.getInstance().name)).id;
        import_base_data_import_file.type_sheet_position = DataImportFormatVO.TYPE_SHEET_POSITION_SCAN;
        import_base_data_import_file.file_id = /* TODO Example file */ null;
        import_base_data_import_file.api_type_id = ImportTranslation.API_TYPE_ID;
        import_base_data_import_file.type = DataImportFormatVO.TYPE_XLSX;
        import_base_data_import_file.type_column_position = DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL;

        await ModuleDAO.getInstance().insertOrUpdateVOs([import_base_data_import_file]);
        import_base_data_import_file = await ModuleDataImport.getInstance().getDataImportFile(default_import_format_name);

        if (!import_base_data_import_file) {
            console.error('La création du format d\'import a échoué');
            return;
        }

        // Puis chaque champs
        let i = 0;
        let import_base_data_import_columns: DataImportColumnVO[] = [];

        import_base_data_import_columns.push(new DataImportColumnVO('code_lang', import_base_data_import_file.id).addColumnLabels(['code_lang']).setMandatory());
        import_base_data_import_columns.push(new DataImportColumnVO('code_text', import_base_data_import_file.id).addColumnLabels(['code_text']).setMandatory());
        import_base_data_import_columns.push(new DataImportColumnVO('translated', import_base_data_import_file.id).addColumnLabels(['translated']).setMandatory());

        await ModuleDAO.getInstance().insertOrUpdateVOs(import_base_data_import_columns);
    }
}