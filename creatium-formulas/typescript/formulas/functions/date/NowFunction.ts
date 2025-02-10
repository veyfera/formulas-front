import { AbstractFunction, Convertation } from "../../internal.js"

export class NowFunction extends AbstractFunction {
    protected minArguments() { return 0 };
    protected maxArguments() { return 0 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const date = new Date();
        date.setMilliseconds(0);
        return date;
    };
}