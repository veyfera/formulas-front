import { Typing, AbstractFunction } from "../../internal.js"

export class LogFunction extends AbstractFunction {
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
            throw new Error("fn2 :: log,1st," + Typing.getType(left));
        } else if (left <= 0) {
            throw new Error("log3");
        }

        if (!Typing.isNumber(right)) {
            throw new Error("fn2 :: log,2nd," + Typing.getType(right));
        } else if (right <= 0 || right === 1) {
            throw new Error("log4");
        }

        // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Math/log#example:_using_math.log_with_a_different_base
        return Math.log(left) / Math.log(right);
    };
}