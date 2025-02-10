// @ts-ignore
import translations from "../../l10n/translations.json"

export class ErrorTranslator {
    static hasTranslationFor(message: string) {
        const parts = message.split(' :: ');
        return translations[parts[1]] !== undefined;
    }

    private static translateTo(message: string, language: 'ru') {
        try {
            const parts = message.split(' :: ');

            const stage = parts[0];
            if (stage === 'optimize' || stage === 'evaluate') {
                const errcode = parts[1];
                const errargs = parts.length > 2 ? parts[2].split(',') : [];

                if (translations.hasOwnProperty(errcode)) {
                    let translated = translations[errcode][language];

                    let index = 1;
                    for (const errarg of errargs) {
                        translated = translated.replace('$' + index++, errarg);
                    }

                    return `${translations.evaluateError.ru}: ${translated}`;
                } else {
                    return `${translations.evaluateError.ru}: ${message}`;
                }
            } else if (['parse', 'validate', 'finalize', 'convert', 'preeval'].includes(stage)) {
                const errcode = parts[1];
                const errarg = parts[2];

                let translated = translations[errcode][language].replace('$1', errarg);

                return `${translations[stage + 'Error'].ru}: ${translated}`;
            } else {
                return message;
            }
        } catch (e) {
            return message;
        }
    }

    static toRussian(message: string) {
        return this.translateTo(message, 'ru');
    }
}