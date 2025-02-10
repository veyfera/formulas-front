import { Typing, AbstractFunction, ExpressionNode } from "../../internal.js"

export class TypeFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    optimize(): ExpressionNode {
        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        return Typing.getType(this.arguments[0].evaluate(scope));
    };
}