import { ExpressionNode, Typing, OptimizedNode, Expression } from "../internal.js"

import { AstString } from "../tsd.js"

export class StringLiteral extends ExpressionNode {
    private value: string;

    constructor(Expr: Expression, node: AstString) {
        super(Expr);

        if (!node || !node.hasOwnProperty('value')) {
            throw new Error('String without value');
        }

        if (!Typing.isString(node.value)) {
            throw new Error('String is not string');
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