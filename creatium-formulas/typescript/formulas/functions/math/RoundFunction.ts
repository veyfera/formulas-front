import { Typing, AbstractFunction } from "../../internal.js"

export class RoundFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 2 };

    roundHalfToEven(number) {
        if (Math.abs(number % 1) === 0.5) {
            return 2 * Math.round(number / 2);
        } else {
            return Math.round(number);
        }
    }

    roundHalfTowardZero(number) {
        if (Math.abs(number % 1) === 0.5) {
            return Math.round(number - 0.5 * Math.sign(number));
        } else {
            return Math.round(number);
        }
    }

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
            throw new Error("fn7 :: round," + Typing.getType(number));
        }

        if (!Typing.isNumber(precision)) {
            throw new Error("convert3 :: " + Typing.getType(precision) + ",number");
        }

        if (!Typing.isFinite(precision)) {
            throw new Error("general1");
        }

        if (Typing.hasFractionalPart(precision)) {
            throw new Error('round3');
        }

        if (precision < -20 || precision > 100) {
            throw new Error("round2 :: " + precision);
        }

        const multabs = Math.pow(10, Math.abs(precision));
        const mult = precision < 0 ? 1 / multabs : multabs;

        if (precision > 0) {
            return Typing.fixNegativeZero(this.roundHalfTowardZero(number * mult) / mult);
        } else {
            return Typing.fixNegativeZero(this.roundHalfToEven(number * mult) / mult);
        }
    };
}