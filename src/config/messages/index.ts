import enMsgs from "./locales/en.json";
import deMsgs from "./locales/de.json";
import esMsgs from "./locales/es.json";
import itMsgs from "./locales/it.json";
import frMsgs from "./locales/fr.json";

import { ServerMessagesEnum } from "../../enums/server-message";

export default class ServerMessages {
    public static errorMsgLocale(languageCode: string = "en", message: string) {
        const supportedLocale: Array<string> = ["en", "de", "fr", "es", "it"];
        const defaultLang = "en";

        if (!supportedLocale.includes(languageCode)) {
            languageCode = defaultLang;
        }

        const en = enMsgs;
        const de = deMsgs;
        const es = esMsgs;
        const fr = frMsgs;
        const it = itMsgs;

        const erroMsgs: any = {
            en,
            de,
            es,
            fr,
            it,
        };

        const msg = erroMsgs[languageCode][message] || "An error occured";

        return msg;
    }
}

export { ServerMessagesEnum };
