import {
    AbstractFunction, Typing
} from "../../internal.js"

export class CountFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isArray(input)) {
            return input.length;
        } else {
            throw new Error('fn1 :: count,' + Typing.getType(input));
        }
    };
}