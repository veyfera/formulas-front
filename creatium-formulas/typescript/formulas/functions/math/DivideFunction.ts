import { AbstractFunction, Typing } from "../../internal.js"

export class DivideFunction extends AbstractFunction {
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
            throw new Error("divide2 :: " + Typing.getType(left) + ',' + Typing.getType(right));
        }

        if (Typing.isZero(right)) {
            throw new Error('divide1');
        }

        return left / right;
    };
}