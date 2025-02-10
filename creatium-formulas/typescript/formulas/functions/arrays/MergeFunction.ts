import {
    Typing, AbstractFunction
} from "../../internal.js"

export class MergeFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 20 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const result = [];

        for (const argument of this.arguments) {
            const operand = argument.evaluate(scope);

            if (Typing.isNull(operand)) {
                return null;
            } else if (Typing.isArray(operand)) {
                result.push(...operand);
            } else {
                throw new Error('fn1 :: merge,' + Typing.getType(operand));
            }
        }

        return result;
    };
}