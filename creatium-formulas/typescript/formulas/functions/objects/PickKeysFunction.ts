import {
    AbstractFunction, Typing
} from "../../internal.js"

export class PickKeysFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);
        const keys = this.arguments[1].evaluate(scope);

        if (!Typing.isObject(input)) {
            throw new Error('pickKeys1 :: ' + Typing.getType(input));
        } else if (!Typing.isArray(keys)) {
            throw new Error('pickKeys2 :: ' + Typing.getType(keys));
        } else {
            const result = {};
            for (const item of keys) {
                if (!Typing.isString(item)) {
                    throw new Error('pickKeys3 :: ' + Typing.getType(item));
                } else if (input.hasOwnProperty(item)) {
                    result[item] = input[item];
                }
            }
            return result;
        }

    };
}
