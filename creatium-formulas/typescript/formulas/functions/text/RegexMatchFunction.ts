import {
    AbstractFunction, ExpressionNode, OptimizedNode, RegexTestFunction, StringLiteral, Typing
} from "../../internal.js"

export class RegexMatchFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 3 };

    optimize(): ExpressionNode {
        this.arguments[1] = this.arguments[1].optimize();

        if (this.arguments[1] instanceof OptimizedNode) {
            if (!Typing.isNull(this.arguments[1].result) && !Typing.isString(this.arguments[1].result)) {
                throw new Error('fn4 :: regexMatch,2nd');
            }
        }

        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);
        const regex = this.arguments[1].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (!Typing.isString(input)) {
            throw new Error('fn4 :: regexMatch,1st');
        }

        if (Typing.isNull(regex)) {
            return null;
        } else if (!Typing.isString(regex)) {
            throw new Error('fn4 :: regexMatch,2nd');
        }

        let flags = '';
        if (this.arguments.length > 2) {
            if (this.arguments[2] instanceof StringLiteral) {
                flags = this.arguments[2].evaluate(scope);

                if (!RegexTestFunction.validateFlags(flags)) {
                    throw new Error('regexMatch4');
                }
            } else {
                throw new Error('regexMatch3');
            }
        }

        let re;
        try {
            re = new RegExp(regex, flags + 'u');
        } catch (e) {
            throw new Error('regexMatch3');
        }

        const result = re.exec(input);

        return result ? {
            match: result[0],
            idx: result.index,
            captures: result.slice(1).map(c => c === undefined ? null : c),
        } : null;
    };
}