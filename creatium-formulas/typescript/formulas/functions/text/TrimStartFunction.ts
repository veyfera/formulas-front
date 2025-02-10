import {
    AbstractFunction, TrimFunction, Typing
} from "../../internal.js"

export class TrimStartFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    trimStart(str, charlist) {
        let start = 0;
        let end = str.length;

        while (start < end && charlist.indexOf(str[start]) >= 0) {
            ++start;
        }

        return (start > 0 || end < str.length) ? str.substring(start, end) : str;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (Typing.isString(input)) {
            return this.trimStart(input, TrimFunction.WHITESPACE);
        } else {
            throw new Error('fn6 :: trimStart,' + Typing.getType(input));
        }
    };
}