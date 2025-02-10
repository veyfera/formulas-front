import {
    AbstractFunction, TrimFunction, Typing
} from "../../internal.js"

export class TrimEndFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    trimEnd(str, charlist) {
        let start = 0;
        let end = str.length;

        while (end > start && charlist.indexOf(str[end - 1]) >= 0) {
            --end;
        }

        return (start > 0 || end < str.length) ? str.substring(start, end) : str;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (Typing.isString(input)) {
            return this.trimEnd(input, TrimFunction.WHITESPACE);
        } else {
            throw new Error('fn6 :: trimEnd,' + Typing.getType(input));
        }
    };
}