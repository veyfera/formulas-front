import { Typing, AbstractFunction, Convertation } from "../../internal.js"

export class AcosFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const number = this.arguments[0].evaluate(scope);

        if (Typing.isNull(number)) {
            return null;
        }

        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: acos," + Typing.getType(number));
        }

        if (number < -1 || number > 1) {
            throw new Error("acos2 :: " + Convertation.toString(number));
        }

        return Math.acos(number);
    };
}