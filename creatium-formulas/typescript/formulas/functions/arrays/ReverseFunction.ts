import {
    Typing, AbstractFunction
} from "../../internal.js"

export class ReverseFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (Typing.isArray(input)) {
            return [...input].reverse();
        } else {
            throw new Error('fn1 :: reverse,' + Typing.getType(input));
        }
    };
}