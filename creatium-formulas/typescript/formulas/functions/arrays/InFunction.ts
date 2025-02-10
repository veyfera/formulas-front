import {
    AbstractFunction, Comparison, Typing
} from "../../internal.js"

export class InFunction extends AbstractFunction {
    static binaryOperatorPrecedence = 7

    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const element = this.arguments[0].evaluate(scope);
        const array = this.arguments[1].evaluate(scope);

        if (Typing.isArray(array)) {
            let result = false;

            for (const item of array) {
                if (Comparison.isEqual(item, element)) {
                    result = true;
                    break;
                }
            }

            return result;
        } else {
            throw new Error('in1 :: ' + Typing.getType(array));
        }
    };
}