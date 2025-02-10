import {
    AbstractFunction, Typing
} from "../../internal.js"

export class ObjectToArrayFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        }

        if (Typing.isObject(input)) {
            const result = [];

            for (const key in input) {
                result.push({ k: key, v: input[key] });
            }

            return result;
        } else {
            throw new Error('objectToArray1 :: ' + Typing.getType(input));
        }
    };
}