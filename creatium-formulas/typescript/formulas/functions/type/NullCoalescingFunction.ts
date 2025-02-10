import { AbstractFunction, Expression, MemberExpression } from "../../internal.js"
import { AstNode } from "../../tsd.js"

export class NullCoalescingFunction extends AbstractFunction {
    static binaryOperatorPrecedence = 11
    static rightAssociative = true

    protected minArguments() { return 1 };
    protected maxArguments() { return 2 };

    constructor(Expr: Expression, args: AstNode[]) {
        super(Expr, args);

        if (this.arguments[0] instanceof MemberExpression) {
            this.arguments[0].disableNullSafety();
        }
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const left = this.arguments[0].evaluate(scope);

        if (this.arguments.length > 1) {
            return left ?? this.arguments[1].evaluate(scope);
        } else {
            return left ?? null;
        }
    };
}