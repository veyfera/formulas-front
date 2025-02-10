import {
    AbstractFunction, ExpressionNode, OptimizedNode, ArrayExpression, Convertation, Typing
} from "../../internal.js"

export class JoinFunction extends AbstractFunction {
    static binaryOperatorPrecedence = 8

    protected minArguments() { return 1 };
    protected maxArguments() { return 2 };

    optimize(): ExpressionNode {
        if (this.arguments[0] instanceof ArrayExpression) {
            if (this.arguments.length === 1) {
                const flatArguments = []; // Вложенные функции раскрываем в плоский список
                for (const node of this.arguments[0].array) {
                    if (node instanceof JoinFunction) {
                        if (node.arguments.length === 1 && node.arguments[0] instanceof ArrayExpression) {
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

                let index = 0;
                for (const argument of this.arguments[0].array) {
                    const optimizedNode = argument.optimize();

                    if (optimizedNode instanceof OptimizedNode) {
                        optimizedNode.result = Convertation.toString(optimizedNode.result);
                        this.arguments[0].array[index] = optimizedNode;
                    }

                    index++;
                }
            } else {
                this.arguments[0] = this.arguments[0].optimize();
                this.arguments[1] = this.arguments[1].optimize();
            }
        }

        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        let delimiter = '';
        if (this.arguments.length > 1) {
            delimiter = this.arguments[1].evaluate(scope);
        }

        if (Typing.isString(input)) {
            return input;
        } else if (Typing.isNull(input)) {
            return '';
        } else if (Typing.isArray(input)) {
            if (!Typing.isString(delimiter)) {
                throw new Error('fn5 :: join,2nd,' + Typing.getType(delimiter));
            }

            let result = '';

            let index = 0;
            for (const operand of input) {
                if (index++ > 0) result += delimiter;
                if (Typing.isNull(operand)) continue;
                result += Convertation.toString(operand);
            }

            return result;
        } else {
            throw new Error('fn6 :: join,' + Typing.getType(input));
        }
    };
}