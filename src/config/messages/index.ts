import enMsgs from "./locales/en.json";

import { ServerMessagesEnum } from "../../enums/server-message";

export default class ServerMessages {
    public static errorMsgLocale(languageCode: string = "en", message: string) {
        const supportedLocale: Array<string> = ["en"];
        const defaultLang = "en";

        if (!supportedLocale.includes(languageCode)) {
            languageCode = defaultLang;
        }

        const en = enMsgs;

        const erroMsgs: any = {
            en,
        };

        const msg = erroMsgs[languageCode][message] || "An error occured";

        return msg;
    }
}

export { ServerMessagesEnum };
