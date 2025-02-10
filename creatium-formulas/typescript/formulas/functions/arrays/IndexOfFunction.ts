import {
    AbstractFunction, Comparison, Typing
} from "../../internal.js"

export class IndexOfFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const array = this.arguments[0].evaluate(scope);

        if (Typing.isNull(array)) {
            return null;
        }

        const element = this.arguments[1].evaluate(scope);

        if (Typing.isArray(array)) {
            let result = -1;

            let index = 0;
            for (const item of array) {
                if (Comparison.isEqual(item, element)) {
                    result = index;
                    break;
                }

                index++;
            }

            return result;
        } else {
            throw new Error('indexOf1 :: ' + Typing.getType(array));
        }
    };
}