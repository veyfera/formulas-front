import { AbstractFunction, OptimizedNode, ExpressionNode, Expression } from "../../internal.js"

import { AstNode } from "../../tsd.js"

export class AndFunction extends AbstractFunction {
    static binaryOperatorPrecedence = 2

    protected minArguments() { return 2 };
    protected maxArguments() { return 10 };

    constructor(Expr: Expression, args: AstNode[]) {
        super(Expr, args.map(arg => ({
            'type': 'CallExpression',
            'arguments': [arg],
            'callee': 'toBoolean',
            'location': [0, 0],
        })));
    }

    optimize(): ExpressionNode {
        let index = 0;
        for (const argument of this.arguments) {
            this.arguments[index++] = argument.optimize();
        }

        for (const argument of this.arguments) {
            // Если любой из аргументов отрицательный на этапе оптимизации, его и возвращаем
            if (argument instanceof OptimizedNode) {
                if (!argument.result) {
                    this.arguments = [argument];
                    return new OptimizedNode(this);
                }
            }
        }

        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const shelve = [];

        // Сначала проверяем все аргументы, которые не используют переменные
        for (const argument of this.arguments) {
            if (argument instanceof OptimizedNode) {
                if (!argument.evaluate(scope)) return false;
            } else {
                shelve.push(argument);
            }
        }

        // Затем все, что осталось
        for (const argument of shelve) {
            if (!argument.evaluate(scope)) return false;
        }

        return true;
    };
}