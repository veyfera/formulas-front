import { Typing, AbstractFunction } from "../../internal.js"

export class SqrtFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const number = this.arguments[0].evaluate(scope);

        if (Typing.isNull(number)) {
            return null;
        }

        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: sqrt," + Typing.getType(number));
        }

        if (number < 0) {
            throw new Error("sqrt2");
        }

        return Math.sqrt(number);
    };
}