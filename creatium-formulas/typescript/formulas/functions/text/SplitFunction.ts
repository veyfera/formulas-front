import {
    AbstractFunction, Typing
} from "../../internal.js"

export class SplitFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);
        const delimiter = this.arguments[1].evaluate(scope);

        if (Typing.isNull(input) || Typing.isNull(delimiter)) {
            return null;
        }

        if (!Typing.isString(input)) {
            throw new Error('fn5 :: split,1st,' + Typing.getType(input));
        }

        if (!Typing.isString(delimiter)) {
            throw new Error('fn5 :: split,2nd,' + Typing.getType(delimiter));
        }

        if (delimiter === '') {
            throw new Error('split3');
        }

        return input.split(delimiter);
    };
}