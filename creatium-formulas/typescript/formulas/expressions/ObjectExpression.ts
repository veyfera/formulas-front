import { ExpressionNode, Expression, OptimizedNode } from "../internal.js"

import { AstObjectExpression } from "../tsd.js"

export class ObjectExpression extends ExpressionNode {
    public object: {
        [name: string]: ExpressionNode
    };

    constructor(Expr: Expression, node: AstObjectExpression) {
        super(Expr);

        if (!node) {
            throw new Error('Wrong node');
        }

        if (!node.hasOwnProperty('properties')) {
            throw new Error('Object without properties');
        }

        this.object = {};

        for (const property of node.properties) {
            if (!property.hasOwnProperty('key')) {
                throw new Error('Object property without key');
            }

            if (typeof property.key !== 'string') {
                throw new Error('Object property key is not string');
            }

            if (!property.hasOwnProperty('value')) {
                throw new Error('Object property without value');
            }

            this.object[property.key] = this.Expr.makeNode(property.value);
        }
    }

    optimize(): ExpressionNode
    {
        let canBeOptimized = true;

        for (const key in this.object) {
            this.object[key] = this.object[key].optimize();

            if (!(this.object[key] instanceof OptimizedNode)) {
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

        const result = {};

        for (const key in this.object) {
            result[key] = this.object[key].evaluate(scope);
        }

        return result;
    }

    gatherExternalIdentifiers() {
        let list = [];

        for (const key in this.object) {
            list = [...list, ...this.object[key].gatherExternalIdentifiers()];
        }

        return list;
    }

    preEvaluate(localVariables: string[], scope: any) {
        let canBeOptimized = true;

        for (const [key, node] of Object.entries(this.object)) {
            this.object[key] = node.preEvaluate(localVariables, scope);

            if (!(this.object[key] instanceof OptimizedNode)) {
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
            '{',
            Object.keys(this.object).map(key =>
                Expression.prettyPrint(key) + ': ' + this.object[key].toCode()
            ).join(', '),
            '}'
        ].join('');
    }
}