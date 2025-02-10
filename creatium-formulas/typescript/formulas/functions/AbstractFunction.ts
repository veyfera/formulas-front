import { ExpressionNode, Expression, OptimizedNode } from "../internal.js"

import { AstNode } from "../tsd.js"

export abstract class AbstractFunction extends ExpressionNode {
    protected minArguments() { return 0 };
    protected maxArguments() { return 0 };

    protected arguments: ExpressionNode[] = [];

    constructor(Expr: Expression, args: AstNode[]) {
        super(Expr);

        if (args.length > this.maxArguments()) {
            throw new Error('Too much arguments');
        } else if (args.length < this.minArguments()) {
            throw new Error('Not enough arguments');
        }

        for (const argument of args) {
            this.arguments.push(this.Expr.makeNode(argument));
        }
    }

    optimize(): ExpressionNode
    {
        let canBeOptimized = true;

        for (let i = 0; i < this.arguments.length; i++) {
            this.arguments[i] = this.arguments[i].optimize();

            if (!(this.arguments[i] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        }

        if (canBeOptimized) {
            return new OptimizedNode(this);
        }

        return this;
    }

    evaluate(scope: any) {};

    localVariableList() {
        return [];
    }

    gatherExternalIdentifiers() {
        let list = [];

        this.arguments.forEach(argument => {
            list = [...list, ...argument.gatherExternalIdentifiers()];
        });

        list = list.filter(item => !this.localVariableList().includes(item));

        return list;
    }


    preEvaluate(localVariables: string[], scope: any) {
        const nestedLocalVariables = [...localVariables, ...this.localVariableList()];

        let canBeOptimized = true;

        this.arguments.forEach((argument, index) => {
            this.arguments[index] = argument.preEvaluate(nestedLocalVariables, scope);

            if (!(this.arguments[index] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        });

        if (canBeOptimized) {
            return new OptimizedNode(this, scope);
        } else {
            if (Object.keys(this.gatherExternalIdentifiers()).length === 0) {
                return new OptimizedNode(this, scope);
            } else {
                return this;
            }
        }
    }

    toCode() {
        const fnName = Object.keys(Expression.FUNCTIONS).find(key => Expression.FUNCTIONS[key] === this.constructor);

        if (fnName) {
            return [
                fnName,
                '(',
                this.arguments.map(el => el.toCode()).join(', '),
                ')'
            ].join('');
        }

        const opName = Object.keys(Expression.BINARY_OPERATORS).find(key => Expression.BINARY_OPERATORS[key] === this.constructor);

        if (opName) {
            return [
                '(',
                this.arguments[0].toCode(),
                ' ' + opName + ' ',
                this.arguments[1].toCode(),
                ')'
            ].join('');
        }

        throw new Error('Unknown function');
    }
}