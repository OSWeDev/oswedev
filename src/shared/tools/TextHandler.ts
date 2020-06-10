export default class TextHandler {

    public static Challenge_Cars: string[] =
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    public static accents_replacements: { [src: string]: string } =
        {
            é: 'e',
            è: 'e',
            ê: 'e',
            à: 'a',
            ò: 'o',
            ô: 'o',
            ù: 'u',
            ì: 'i',
            î: 'i',
            û: 'u',
            ç: 'c',
        };

    public static getInstance(): TextHandler {
        if (!TextHandler.instance) {
            TextHandler.instance = new TextHandler();
        }
        return TextHandler.instance;
    }

    private static instance: TextHandler = null;

    private constructor() {
    }

    public standardize_for_comparaison(src: string): string {
        let res: string = src.trim().toLowerCase();
        let length: number = res.length;

        for (let i = 0; i < length; i++) {
            let c = res[i];

            if (!!TextHandler.accents_replacements[c]) {
                res = ((i > 0) ? res.substr(0, i) : '') + TextHandler.accents_replacements[c] + ((i < (length - 1)) ? i + 1 : length);
            }
        }

        return res;
    }

    /**
     * Renvoie un ID en lowercase et caractères spéciaux et espaces remplacés par _
     * @param txt Le texte à convertir
     */
    public formatTextToID(txt: string): string {
        return txt.toLowerCase().replace(/[^a-z]/g, '_').replace(/__+/g, '_');
    }

    public generateChallenge(): string {
        // On génère un code à 8 caractères, chiffres et lettres.
        let res: string = "";
        let i: number = 0;

        while (i < 8) {
            res += TextHandler.Challenge_Cars[Math.floor(Math.random() * TextHandler.Challenge_Cars.length)];
            i++;
        }

        return res;
    }
}