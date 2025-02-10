import {
    AbstractFunction, ExpressionNode, ObjectExpression, OptimizedNode
} from "../../internal.js"

export class LetFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    protected arguments: [ObjectExpression, ExpressionNode];

    static IDRE = /^[a-z]+[a-zA-Z0-9_]*$/;

    assertId(key, returnFalse = false) {
        const match = /^[a-z]+[a-zA-Z0-9_]*$/.test(key);
        if (!match) {
            if (returnFalse) return false;
            throw new Error('let2 :: ' + key);
        }

        return true;
    }

    optimize(): ExpressionNode
    {
        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        if (!(this.arguments[0] instanceof ObjectExpression)) {
            throw new Error('let1');
        }

        for (const key in this.arguments[0].object) {
            if (!LetFunction.IDRE.test(key)) {
                throw new Error('let2 :: ' + key );
            }

            scope = {...scope};
            scope[key] = this.arguments[0].object[key].evaluate(scope);
        }

        return this.arguments[1].evaluate(scope);
    }

    gatherExternalIdentifiers() {
        let localVariables = [];
        let list = [];

        for (const [key, value] of Object.entries(this.arguments[0].object)) {
            this.assertId(key);

            list = [
                ...list,
                ...value.gatherExternalIdentifiers().filter(id => !localVariables.includes(id))
            ];

            localVariables.push(key);
        }

        list = [
            ...list,
            ...this.arguments[1].gatherExternalIdentifiers().filter(id => !localVariables.includes(id))
        ];

        return list;
    }

    preEvaluate(localVariables, scope) {
        const nestedLocalVariables = [...localVariables];
        let canBeOptimized = true;

        for (const [key, value] of Object.entries(this.arguments[0].object)) {
            this.assertId(key);
            this.arguments[0].object[key] = value.preEvaluate(nestedLocalVariables, scope);

            if (this.arguments[0].object[key] instanceof OptimizedNode) {
                // Если переменная раскрывается, то добавляем ее в скоуп
                scope = {...scope};
                scope[key] = this.arguments[0].object[key].evaluate(scope);
            } else {
                // Иначе она попадает в список локальных переменных и не меняется больше
                canBeOptimized = false;
                nestedLocalVariables.push(key);
            }
        }

        this.arguments[1] = this.arguments[1].preEvaluate(nestedLocalVariables, scope);
        if (!(this.arguments[1] instanceof OptimizedNode)) {
            canBeOptimized = false;
        }

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

}