import {
    AbstractFunction, ExpressionNode, ArrayExpression, Typing, Comparison
} from "../../internal.js"

export class MinFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    optimize(): ExpressionNode {
        if (this.arguments[0] instanceof ArrayExpression) {
            return super.optimize();
        } else {
            return this;
        }
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (!Typing.isArray(input)) {
            throw new Error('fn1 :: min,' + Typing.getType(input));
        }

        if (input.length === 0) return null;

        let result = null;

        for (const item of input) {
            if (Typing.isNull(item)) continue;

            if (result === null || Comparison.isLess(item, result)) {
                result = item;
            }
        }

        return result;
    };
}