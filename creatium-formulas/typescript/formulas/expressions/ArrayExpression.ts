import { ExpressionNode, Expression, OptimizedNode } from "../internal.js"

import { AstArrayExpression, AstNode } from "../tsd.js"

export class ArrayExpression extends ExpressionNode {
    public array: ExpressionNode[];

    constructor(Expr: Expression, node: AstArrayExpression) {
        super(Expr);

        if (!node) {
            throw new Error('Wrong node');
        }

        if (!node.hasOwnProperty('elements')) {
            throw new Error('Array without elements');
        }

        this.array = [];

        for (const element of node.elements) {
            this.array.push(this.Expr.makeNode(element));
        }
    }

    optimize(): ExpressionNode
    {
        let canBeOptimized = true;

        for (let i = 0; i < this.array.length; i++) {
            this.array[i] = this.array[i].optimize();

            if (!(this.array[i] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        }

        if (canBeOptimized) {
            return new OptimizedNode(this);
        }

        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const result = [];

        for (const node of this.array) {
            result.push(node.evaluate(scope));
        }

        return result;
    }

    gatherExternalIdentifiers() {
        let list = [];

        this.array.forEach(node => {
            list = [...list, ...node.gatherExternalIdentifiers()];
        });

        return list;
    }

    preEvaluate(localVariables: string[], scope: any) {
        let canBeOptimized = true;

        for (const [key, node] of Object.entries(this.array)) {
            this.array[key] = node.preEvaluate(localVariables, scope);

            if (!(this.array[key] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        }

        if (canBeOptimized) {
            return new OptimizedNode(this, scope);
        }

        return this;
    }

    toCode() {
        return [
            '[',
            this.array.map(el => el.toCode()).join(', '),
            ']'
        ].join('');
    }
}