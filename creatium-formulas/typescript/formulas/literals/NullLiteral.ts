import { Expression, ExpressionNode, OptimizedNode } from "../internal.js"

import { AstNull } from "../tsd.js"

export class NullLiteral extends ExpressionNode {
    private value: number;

    constructor(Expr: Expression, node: AstNull) {
        super(Expr);

        this.value = null;
    }

    optimize(): OptimizedNode {
        return new OptimizedNode(this);
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        return this.value;
    }

    public gatherExternalIdentifiers() {
        return [];
    }

    preEvaluate(localVariables: string[], scope: any) {
        return new OptimizedNode(this, scope);
    }

    toCode() {
        return Expression.prettyPrint(this.value);
    }
}