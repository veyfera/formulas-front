import {
    AbstractFunction, Typing
} from "../../internal.js"

export class SliceFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 3 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);
        let start = this.arguments[1].evaluate(scope);

        if (Typing.isNull(input) || Typing.isNull(start)) {
            return null;
        } else if (Typing.isArray(input)) {
            if (!Typing.isNumber(start)) {
                throw new Error('slice3 :: ' + Typing.getType(start));
            }

            if (!Typing.isFinite(start) || Typing.hasFractionalPart(start)) {
                throw new Error('fn3 :: slice,2nd');
            }

            if (start < -input.length) start = -input.length;

            let count;
            if (this.arguments.length > 2) {
                count = this.arguments[2].evaluate(scope);

                if (Typing.isNull(count)) {
                    return null;
                } else if (!Typing.isFinite(count) || Typing.hasFractionalPart(count)) {
                    throw new Error('fn3 :: slice,3rd');
                } else if (count <= 0) {
                    throw new Error('slice2 :: ' + count);
                }
            } else {
                count = undefined;
            }

            return input.slice(start, count ? start + count : count);
        } else {
            throw new Error('fn1 :: slice,' + Typing.getType(input));
        }
    };
}