import { Typing, AbstractFunction, Convertation } from "../../internal.js"

export class SubtractFunction extends AbstractFunction {
    static binaryOperatorPrecedence = 9

    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);

        if (Typing.isNull(left) || Typing.isNull(right)) {
            return null;
        }

        if (Typing.isDate(left) && Typing.isNumber(right)) {
            return Convertation.toDate(Convertation.toNumber(left) - right);
        }

        if (!Typing.isNumber(left) || !Typing.isNumber(right)) {
            throw new Error("subtract1 :: " + Typing.getType(right) + ',' + Typing.getType(left));
        }

        return left - right;
    };
}