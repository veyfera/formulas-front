import { Typing, AbstractFunction } from "../../internal.js"

export class ModFunction extends AbstractFunction {
    static binaryOperatorPrecedence = 10

    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);

        if (Typing.isNull(left) || Typing.isNull(right)) {
            return null;
        }

        if (!Typing.isNumber(left) || !Typing.isNumber(right)) {
            throw new Error("mod2 :: " + Typing.getType(left) + ',' + Typing.getType(right));
        }

        if (Typing.isZero(right)) {
            throw new Error('mod1');
        }

        return left % right;
    };
}