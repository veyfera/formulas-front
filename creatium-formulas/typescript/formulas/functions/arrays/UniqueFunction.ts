import {
    Typing, AbstractFunction, Comparison, ExpressionNode
} from "../../internal.js"

export class UniqueFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    optimize(): ExpressionNode {
        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (Typing.isArray(input)) {
            const result = [];
            for (let i = 0; i < input.length; i++) {
                let isUnique = true;
                for (let j = 0; j < result.length; j++) {
                    if (Comparison.isEqual(input[i], result[j])) {
                        isUnique = false;
                        break;
                    }
                }

                if (isUnique) result.push(input[i]);
            }

            return result;
        } else {
            throw new Error('unique1 :: ' + Typing.getType(input));
        }
    };
}