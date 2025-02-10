import { Comparison, AbstractFunction } from "../../internal.js"

export class GreaterFunction extends AbstractFunction {
    static binaryOperatorPrecedence = 7

    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);

        return Comparison.isGreater(left, right);
    };
}