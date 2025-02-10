import { Expression } from "./internal.js"

export abstract class ExpressionNode {
    Expr: Expression

    constructor(Expr: Expression) {
        this.Expr = Expr;
    }

    abstract optimize(): ExpressionNode;

    abstract evaluate(scope: any): any;

    abstract gatherExternalIdentifiers();

    abstract preEvaluate(localVariables: string[], scope: any): any;

    abstract toCode(): string;
}