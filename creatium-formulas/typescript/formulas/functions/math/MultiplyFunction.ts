import {
    AbstractFunction, OptimizedNode, ExpressionNode, ArrayExpression, Typing
} from "../../internal.js"

export class MultiplyFunction extends AbstractFunction {
    static binaryOperatorPrecedence = 10

    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    optimize(): ExpressionNode {
        if (this.arguments[0] instanceof ArrayExpression) {
            const flatArguments = []; // Вложенные функции раскрываем в плоский список
            for (const node of this.arguments[0].array) {
                if (node instanceof MultiplyFunction) {
                    if (node.arguments[0] instanceof ArrayExpression) {
                        for (const nestedNode of node.arguments[0].array) {
                            flatArguments.push(nestedNode);
                        }
                    } else {
                        flatArguments.push(node);
                    }
                } else {
                    flatArguments.push(node);
                }
            }
            this.arguments[0].array = flatArguments;

            let argumentsToOptimize = [];
            let argumentsToNotOptimize = [];

            for (const argument of this.arguments[0].array) {
                const optimizedNode = argument.optimize();

                if (optimizedNode instanceof OptimizedNode) {
                    argumentsToOptimize.push(optimizedNode);
                } else {
                    argumentsToNotOptimize.push(optimizedNode);
                }
            }

            if (argumentsToOptimize.length) {
                if (argumentsToOptimize.length > 1) {
                    this.arguments[0].array = argumentsToOptimize;
                    argumentsToOptimize = [new OptimizedNode(this)];
                }

                this.arguments[0].array = [...argumentsToNotOptimize, ...argumentsToOptimize];
            }

            if (!argumentsToNotOptimize.length) {
                return new OptimizedNode(this);
            }
        }

        return this;
    }

    private result: number;

    private multiply(operand) {
        if (Typing.isNull(operand)) {
            return null;
        } else if (Typing.isNumber(operand)) {
            // Mongo не умеет умножать конечные числа больше этого диапазона
            if (Typing.isFinite(operand)) {
                if (operand > Typing.MONGO_LONG_MAX || operand < Typing.MONGO_LONG_MIN) {
                    throw new Error('general1');
                }
            }

            return this.result *= operand;
        } else {
            throw new Error('fn7 :: multiply,' + Typing.getType(operand));
        }
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        this.result = 1;

        if (this.arguments[0] instanceof ArrayExpression) {
            for (const argument of this.arguments[0].array) {
                if (this.multiply(argument.evaluate(scope)) === null) return null;
            }
        } else {
            const input = this.arguments[0].evaluate(scope);

            if (Typing.isNull(input)) {
                return null;
            } else if (Typing.isArray(input)) {
                for (const operand of input) {
                    if (this.multiply(operand) === null) return null;
                }
            } else {
                throw new Error('fn7 :: multiply,' + Typing.getType(input));
            }
        }

        return this.result;
    };
}