import { Typing, AbstractFunction } from "../../internal.js"

export class TanFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const number = this.arguments[0].evaluate(scope);

        if (Typing.isNull(number)) {
            return null;
        }

        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: tan," + Typing.getType(number));
        }

        if (Typing.isInfinite(number)) {
            throw new Error("tan2");
        }

        return Math.tan(number);
    };
}