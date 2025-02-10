import { Expression, ExpressionNode, OptimizedNode, Typing } from "./internal.js"

import { AstIdentifier } from "./tsd.js"

export class Identifier extends ExpressionNode {
    private name: string;
    private column: boolean;

    private existsMode: boolean = false;

    constructor(Expr: Expression, node: AstIdentifier) {
        super(Expr);

        if (!node || !node.hasOwnProperty('name')) {
            throw new Error('String without name');
        }

        if (!Typing.isString(node.name)) {
            throw new Error('Name is not string');
        }

        if (!node.hasOwnProperty('column')) {
            this.column = false;
        } else {
            this.column = !!node.column;
        }

        this.name = node.name;
    }

    enableExistsMode() {
        this.existsMode = true;
    }

    optimize(): Identifier {
        return this;
    }

    _evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        if (this.column) {
            throw new Error('Column execution is not supported here');
        }

        return scope.hasOwnProperty(this.name);
    }

    evaluate(scope: any) {
        if (this._evaluate(scope)) {
            return scope[this.name];
        } else {
            if (this.existsMode) {
                return null;
            } else {
                throw new Error("var1 :: " + this.name);
            }
        }
    }

    evaluateExists(scope: any) {
        return this._evaluate(scope);
    }

    gatherExternalIdentifiers() {
        if (this.column) {
            // Возвращаем идентификатор с @, чтобы он точно не оптимизировался
            return ['@' + this.name];
        } else {
            return [this.name];
        }
    }

    preEvaluate(localVariables: string[], scope: any) {
        if (this.column || localVariables.includes(this.name)) {
            return this;
        } else {
            return new OptimizedNode(this, scope);
        }
    }

    toCode() {
        return this.column ? '@' + this.name : this.name;
    }
}