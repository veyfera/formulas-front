import {
    AbstractFunction, OptimizedNode, ExpressionNode, ArrayExpression, Typing, Convertation
} from "../../internal.js"

export class SumFunction extends AbstractFunction {
    static binaryOperatorPrecedence = 9

    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    optimize(): ExpressionNode {
        if (this.arguments[0] instanceof ArrayExpression) {
            const flatArguments = []; // Вложенные функции раскрываем в плоский список
            for (const node of this.arguments[0].array) {
                if (node instanceof SumFunction) {
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
    private isDate = false;

    private add(operand) {
        if (Typing.isNull(operand)) {
            return null;
        } else if (Typing.isNumber(operand)) {
            return this.result += operand;
        } else if (Typing.isDate(operand)) {
            this.isDate = true;
            return this.result += Convertation.toNumber(operand);
        } else {
            throw new Error('add1 :: ' + Typing.getType(operand));
        }
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        this.result = 0;

        if (this.arguments[0] instanceof ArrayExpression) {
            for (const argument of this.arguments[0].array) {
                if (this.add(argument.evaluate(scope)) === null) return null;
            }
        } else {
            const input = this.arguments[0].evaluate(scope);

            if (Typing.isNull(input)) {
                return null;
            } else if (Typing.isArray(input)) {
                for (const operand of input) {
                    if (this.add(operand) === null) return null;
                }
            } else {
                throw new Error('add1 :: ' + Typing.getType(input));
            }
        }

        if (this.isDate) return Convertation.toDate(this.result);
        else return this.result;
    };
}