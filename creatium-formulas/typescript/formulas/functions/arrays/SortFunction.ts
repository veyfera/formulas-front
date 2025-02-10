import {
    AbstractFunction, Comparison, ExpressionNode, Typing
} from "../../internal.js"

export class SortFunction extends AbstractFunction {
    protected minArguments() { return 1 };
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
            if (this.arguments.length > 1) {
                return input.map(item => {
                    const childScope = {...scope};
                    childScope.item = item;
                    return {
                        item,
                        order: this.arguments[1].evaluate(childScope),
                    };
                }).sort(function (a, b) {
                    if (Comparison.isGreater(a.order, b.order)) return 1;
                    else if (Comparison.isLess(a.order, b.order)) return -1;
                    else return 0;
                }).map(wrappedItem => wrappedItem.item);
            } else {
                return input.sort(function (a, b) {
                    if (Comparison.isGreater(a, b)) return 1;
                    else if (Comparison.isLess(a, b)) return -1;
                    else return 0;
                });
            }
        } else {
            throw new Error('fn1 :: sort,' + Typing.getType(input));
        }
    }

    localVariableList() {
        return ['item'];
    }
}