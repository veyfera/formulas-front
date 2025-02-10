import {
    AbstractFunction, ExpressionNode, OptimizedNode, StringLiteral, Typing
} from "../../internal.js"

export class RegexTestFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 3 };

    static validateFlags(flags: string) {
        return flags.match(/^[ims]*$/) !== null;
    }

    optimize(): ExpressionNode {
        this.arguments[1] = this.arguments[1].optimize();

        if (this.arguments[1] instanceof OptimizedNode) {
            if (!Typing.isNull(this.arguments[1].result) && !Typing.isString(this.arguments[1].result)) {
                throw new Error('fn4 :: regexTest,2nd');
            }
        }

        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);
        const regex = this.arguments[1].evaluate(scope);

        if (Typing.isNull(input)) {
            return false;
        } else if (!Typing.isString(input)) {
            throw new Error('fn4 :: regexTest,1st');
        }

        if (Typing.isNull(regex)) {
            return false;
        } else if (!Typing.isString(regex)) {
            throw new Error('fn4 :: regexTest,2nd');
        }

        let flags = '';
        if (this.arguments.length > 2) {
            if (this.arguments[2] instanceof StringLiteral) {
                flags = this.arguments[2].evaluate(scope);

                if (!RegexTestFunction.validateFlags(flags)) {
                    throw new Error('regexTest4');
                }
            } else {
                throw new Error('regexTest3');
            }
        }

        let re;
        try {
            re = new RegExp(regex, flags + 'u');
        } catch (e) {
            throw new Error('regexTest3');
        }

        return re.test(input);
    };
}