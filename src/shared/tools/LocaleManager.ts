import DefaultTranslation from '../modules/Translation/vos/DefaultTranslation';

export default class LocaleManager {

    public static getInstance() {
        if (!LocaleManager.instance) {
            LocaleManager.instance = new LocaleManager();
        }

        return LocaleManager.instance;
    }

    private static instance: LocaleManager = null;

    public i18n: any;
    private defaultLocale: string;

    private constructor() {
    }

    public label(txt: string, params = {}): string {
        let res = this.t(
            txt + DefaultTranslation.DEFAULT_LABEL_EXTENSION,
            params
        );
        return res ? res.toString() : null;
    }

    public t(txt: string, params = {}): string {
        if (!txt) {
            return txt;
        }

        let res = LocaleManager.getInstance().i18n.t(txt, params);
        return res ? res.toString() : null;
    }

    public setDefaultLocale(defaultLocale: string) {
        this.defaultLocale = defaultLocale;
    }

    public getDefaultLocale() {
        return this.defaultLocale;
    }
}