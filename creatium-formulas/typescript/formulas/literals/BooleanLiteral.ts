import { ExpressionNode, Typing, OptimizedNode, Expression } from "../internal.js"

import { AstBoolean } from "../tsd.js"

export class BooleanLiteral extends ExpressionNode {
    private value: boolean;

    constructor(Expr: Expression, node: AstBoolean) {
        super(Expr);

        if (!node || !node.hasOwnProperty('value')) {
            throw new Error('Boolean without value');
        }

        if (!Typing.isBoolean(node.value)) {
            throw new Error('Boolean is not boolean');
        }

        this.value = node.value;
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