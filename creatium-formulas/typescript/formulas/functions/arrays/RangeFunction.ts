import { Typing, AbstractFunction } from "../../internal.js"

export class RangeFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 3 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        let start = this.arguments[0].evaluate(scope);
        const end = this.arguments[1].evaluate(scope);

        let step = 1;
        if (this.arguments.length > 2) {
            step = this.arguments[2].evaluate(scope);
        }

        if (!Typing.isNumber(start)) {
            throw new Error("fn2 :: range,1st," + Typing.getType(start));
        }

        if (!Typing.is32BitInteger(start)) {
            throw new Error('fn3 :: range,1st');
        }

        if (!Typing.isNumber(end)) {
            throw new Error("fn2 :: range,2nd," + Typing.getType(end));
        }

        if (!Typing.is32BitInteger(end)) {
            throw new Error('fn3 :: range,2nd');
        }

        if (!Typing.isNumber(step)) {
            throw new Error("fn2 :: range,3rd," + Typing.getType(step));
        }

        if (!Typing.is32BitInteger(step)) {
            throw new Error('fn3 :: range,3rd');
        }

        if (step === 0) {
            throw new Error("range7");
        }

        const length = Math.max(Math.ceil((end - start) / step), 0);
        const range = Array(length);

        for (let idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }

        return range;
    };
}