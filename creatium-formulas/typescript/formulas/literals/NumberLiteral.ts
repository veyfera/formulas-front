import { Expression, ExpressionNode, OptimizedNode, Typing } from "../internal.js"

import { AstNumber } from "../tsd.js"

export class NumberLiteral extends ExpressionNode {
    private value: number;

    constructor(Expr: Expression, node: AstNumber) {
        super(Expr);

        if (!node || !node.hasOwnProperty('value')) {
            throw new Error('Number without value');
        }

        if (node.value === 'NaN') {
            this.value = NaN;
            return;
        }

        if (node.value === 'Infinity') {
            this.value = Infinity;
            return;
        }

        if (!Typing.isNumber(node.value)) {
            throw new Error('Number is not number');
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