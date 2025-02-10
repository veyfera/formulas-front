import {
    AbstractFunction, Typing
} from "../../internal.js"

export class LengthFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isString(input)) {
            // spread оператор корректно обрабатывает эмодзи
            return [...input].length;
        } else {
            throw new Error('fn6 :: length,' + Typing.getType(input));
        }
    };
}