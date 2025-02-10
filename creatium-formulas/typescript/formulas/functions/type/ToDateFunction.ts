import { AbstractFunction, Convertation, ExpressionNode } from "../../internal.js"

export class ToDateFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    optimize(): ExpressionNode {
        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        return Convertation.toDate(this.arguments[0].evaluate(scope));
    };
}