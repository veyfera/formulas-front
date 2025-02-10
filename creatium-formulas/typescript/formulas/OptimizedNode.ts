import { Expression, ExpressionNode } from "./internal.js"

export class OptimizedNode extends ExpressionNode {
    public source: ExpressionNode;
    public result: any;

    constructor(node: ExpressionNode, scope: any = null) {
        super(node.Expr);

        this.source = node;
        this.result = node.evaluate(scope || {});
    }

    optimize(): ExpressionNode {
        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        return this.result;
    }

    gatherExternalIdentifiers() {
        return [];
    }

    preEvaluate(localVariables: string[], scope: any): OptimizedNode {
        return this;
    }

    toCode() {
        return Expression.prettyPrint(this.result, false);
    }
}