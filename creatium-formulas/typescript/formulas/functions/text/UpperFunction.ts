import {
    AbstractFunction, ExpressionNode, Typing
} from "../../internal.js"

export class UpperFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (Typing.isString(input)) {
            return input.toUpperCase();
        } else {
            throw new Error('fn6 :: upper,' + Typing.getType(input));
        }
    };
}