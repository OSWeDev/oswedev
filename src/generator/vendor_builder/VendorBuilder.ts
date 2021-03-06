import ModuleFileServer from '../../server/modules/File/ModuleFileServer';
import IVendorGeneratorOptions from './IVendorGeneratorOptions';

export default class VendorBuilder {

    public static getInstance(): VendorBuilder {
        if (!VendorBuilder.instance) {
            VendorBuilder.instance = new VendorBuilder();
        }
        return VendorBuilder.instance;
    }

    protected static instance: VendorBuilder = null;

    private constructor() { }

    /* istanbul ignore next: really difficult test depending on files */
    public async generate_vendor() {

        if (process.env.IGNORE_VENDOR_COMPILATION == 'true') {
            return;
        }

        let vendor_path = './vendor/vendor.js';
        let vendor_generator_options: IVendorGeneratorOptions = require(process.cwd() + '/vendor/vendor_generator_options.json');

        let vendor_content = this.get_vendor_file_content(vendor_generator_options);

        await ModuleFileServer.getInstance().writeFile(vendor_path, vendor_content);
    }

    public get_vendor_file_content(vendor_generator_options: IVendorGeneratorOptions): string {

        if (!vendor_generator_options) {
            return '';
        }

        let vendor_content = '';

        let vendor_deps: string[] = vendor_generator_options.addins;

        for (let i in vendor_deps) {

            let dep_name = vendor_deps[i];

            if (dep_name.toLowerCase() == 'oswedev') {
                continue;
            }

            vendor_content += "require('" + dep_name + "');\n";
        }

        return vendor_content;
    }
}