import {
    AbstractFunction, Typing, Convertation, ExpressionNode
} from "../../internal.js"

export class FilterFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 2 };

    optimize(): ExpressionNode
    {
        for (let i = 0; i < this.arguments.length; i++) {
            this.arguments[i] = this.arguments[i].optimize();
        }

        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (Typing.isArray(input)) {
            const result = [];

            input.forEach(item => {
                const childScope = {...scope};
                childScope.item = item;

                if (Convertation.toBoolean(this.arguments[1].evaluate(childScope))) {
                    result.push(item);
                }
            });

            return result;
        } else {
            throw new Error('fn1 :: filter,' + Typing.getType(input));
        }
    }

    localVariableList() {
        return ['item'];
    }
}