import { Typing, AbstractFunction } from "../../internal.js"

export class TruncFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const number = this.arguments[0].evaluate(scope);

        let precision = 0;
        if (this.arguments.length > 1) {
            precision = this.arguments[1].evaluate(scope);
        }

        if (Typing.isNull(number) || Typing.isNull(precision)) {
            return null;
        }

        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: trunc," + Typing.getType(number));
        }

        if (!Typing.isNumber(precision)) {
            throw new Error("convert3 :: " + Typing.getType(precision) + ",number");
        }

        if (precision < -20 || precision > 100) {
            throw new Error("trunc2 :: " + precision);
        }

        const mult = Math.pow(10, precision);
        return Typing.fixNegativeZero(Math.trunc(number * mult) / mult);
    };
}