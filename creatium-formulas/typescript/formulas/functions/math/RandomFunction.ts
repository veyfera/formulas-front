import { AbstractFunction, ExpressionNode } from "../../internal.js"

export class RandomFunction extends AbstractFunction {
    protected minArguments() { return 0 };
    protected maxArguments() { return 0 };

    optimize(): ExpressionNode {
        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        return Math.random();
    };
}