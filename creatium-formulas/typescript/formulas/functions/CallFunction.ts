import { AbstractFunction } from "../internal.js"

export class CallFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        throw new Error('general2 :: call');
    };
}