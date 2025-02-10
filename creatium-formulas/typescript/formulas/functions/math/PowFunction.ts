import { Typing, AbstractFunction } from "../../internal.js"

export class PowFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);

        if (Typing.isNull(left) || Typing.isNull(right)) {
            return null;
        }

        if (!Typing.isNumber(left)) {
            throw new Error("fn2 :: pow,1st," + Typing.getType(left));
        }

        if (!Typing.isNumber(right)) {
            throw new Error("fn2 :: pow,2nd," + Typing.getType(right));
        }

        const result = Math.pow(left, right);

        if (result > Typing.DOUBLE_RANGE) {
            throw new Error("pow3");
        }

        if (Typing.isNaN(result)) {
            throw new Error("pow4");
        }

        return result;
    };
}