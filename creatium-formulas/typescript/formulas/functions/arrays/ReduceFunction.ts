import {
    Typing, AbstractFunction, ExpressionNode
} from "../../internal.js"

export class ReduceFunction extends AbstractFunction {
    protected minArguments() { return 3 };
    protected maxArguments() { return 3 };

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
            let result = this.arguments[2].evaluate(scope);

            input.forEach(item => {
                const childScope = {...scope};
                childScope.item = item;
                childScope.value = result;

                result = this.arguments[1].evaluate(childScope);
            });

            return result;
        } else {
            throw new Error('fn1 :: reduce,' + Typing.getType(input));
        }
    }

    localVariableList() {
        return ['value', 'item'];
    }
}