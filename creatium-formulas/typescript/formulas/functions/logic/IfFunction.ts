import { AbstractFunction, Expression } from "../../internal.js"

import { AstNode } from "../../tsd.js"

export class IfFunction extends AbstractFunction {
    protected minArguments() { return 3 };
    protected maxArguments() { return 101 };

    constructor(Expr: Expression, args: AstNode[]) {
        if ((args.length - 1) % 2 > 0) {
            throw new Error('Wrong argument count');
        }

        // Чтобы не модифицировать оригинальный объект
        args = [...args];

        for (let i = 0; i < (args.length - 1); i += 2) {
            args[i] = {
                'type': 'CallExpression',
                'arguments': [args[i]],
                'callee': 'toBoolean',
                'location': [0, 0],
            };
        }

        super(Expr, args);
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        for (let i = 0; i < (this.arguments.length - 1); i += 2) {
            if (this.arguments[i].evaluate(scope)) {
                return this.arguments[i + 1].evaluate(scope);
            }
        }

        return this.arguments[this.arguments.length - 1].evaluate(scope);
    }
}