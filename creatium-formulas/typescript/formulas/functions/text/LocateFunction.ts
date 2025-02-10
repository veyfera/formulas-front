import {
    AbstractFunction, Typing
} from "../../internal.js"

/** Поиск с учетом эмодзи */
function spreadIndexOf(input, needle, start = 0) {
    const characters = [...input];
    const needleChars = [...needle];
    const needleLength = needleChars.length;

    for (let i = start; i <= characters.length - needleLength; i++) {
        if (characters.slice(i, i + needleLength).join('') === needle) {
            return i;
        }
    }

    return -1;
}

export class LocateFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 3 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);
        const needle = this.arguments[1].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (!Typing.isString(input)) {
            throw new Error('fn5 :: locate,1st,' + Typing.getType(input));
        }

        if (!Typing.isString(needle)) {
            throw new Error('fn5 :: locate,2nd,' + Typing.getType(needle));
        }

        let start = 0;
        if (this.arguments.length > 2) {
            start = this.arguments[2].evaluate(scope);
        }

        return spreadIndexOf(input, needle, start);
    };
}