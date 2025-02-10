import { AbstractFunction, Convertation } from "../../internal.js"

export class NotFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        return !Convertation.toBoolean(this.arguments[0].evaluate(scope));
    };
}