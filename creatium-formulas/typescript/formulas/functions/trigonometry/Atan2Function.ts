import { Typing, AbstractFunction } from "../../internal.js"

export class Atan2Function extends AbstractFunction {
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
            throw new Error("fn7 :: atan2," + Typing.getType(left));
        }

        if (!Typing.isNumber(right)) {
            throw new Error("fn7 :: atan2," + Typing.getType(right));
        }

        // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2#example:_using_math.atan2_with_a_different_base
        return Math.atan2(left, right);
    };
}