import {
    AbstractFunction, Expression, MemberExpression, Identifier, StringLiteral, BooleanLiteral, NumberLiteral,
    DateLiteral, ArrayExpression, NullLiteral, ObjectExpression, ExpressionNode, OptimizedNode
} from "../../internal.js"

import { AstNode } from "../../tsd";

export class ExistsFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    constructor(Expr: Expression, args: AstNode[]) {
        super(Expr, args);

        if (!(
            this.arguments[0] instanceof BooleanLiteral ||
            this.arguments[0] instanceof StringLiteral ||
            this.arguments[0] instanceof NumberLiteral ||
            this.arguments[0] instanceof NullLiteral ||
            this.arguments[0] instanceof DateLiteral ||
            this.arguments[0] instanceof ArrayExpression ||
            this.arguments[0] instanceof ObjectExpression ||
            this.arguments[0] instanceof MemberExpression ||
            this.arguments[0] instanceof Identifier
        )) {
            throw new Error('exists1');
        }

        if (this.arguments[0] instanceof MemberExpression || this.arguments[0] instanceof Identifier) {
            this.arguments[0].enableExistsMode();
        }
    }

    optimize(): ExpressionNode {
        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        if (
            this.arguments[0] instanceof BooleanLiteral ||
            this.arguments[0] instanceof StringLiteral ||
            this.arguments[0] instanceof NumberLiteral ||
            this.arguments[0] instanceof NullLiteral ||
            this.arguments[0] instanceof DateLiteral ||
            this.arguments[0] instanceof ArrayExpression ||
            this.arguments[0] instanceof ObjectExpression
        ) {
            return true;
        }

        if (this.arguments[0] instanceof OptimizedNode) {
            return true;
        }

        if (this.arguments[0] instanceof MemberExpression || this.arguments[0] instanceof Identifier) {
            return this.arguments[0].evaluateExists(scope);
        }

        return false;
    }


    preEvaluate(localVariables, scope) {
        try {
            if (this.arguments[0] instanceof Identifier) {
                const result = this.arguments[0].evaluateExists(scope);
                return new OptimizedNode(new BooleanLiteral(this.Expr, { 'type': 'Boolean', 'value': result } as any));
            }

            return super.preEvaluate(localVariables, scope);
        } catch (e) {
            if (e.message === 'undefined') {
                return new OptimizedNode(new BooleanLiteral(this.Expr, { 'type': 'Boolean', 'value': false } as any));
            }

            throw e;
        }
    }
}