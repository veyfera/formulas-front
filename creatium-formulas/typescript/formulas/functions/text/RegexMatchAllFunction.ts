import {
    AbstractFunction, ExpressionNode, OptimizedNode, RegexTestFunction, StringLiteral, Typing
} from "../../internal.js"

export class RegexMatchAllFunction extends AbstractFunction {
    protected minArguments() { return 2 };
    protected maxArguments() { return 3 };

    optimize(): ExpressionNode {
        this.arguments[1] = this.arguments[1].optimize();

        if (this.arguments[1] instanceof OptimizedNode) {
            if (!Typing.isNull(this.arguments[1].result) && !Typing.isString(this.arguments[1].result)) {
                throw new Error('fn4 :: regexMatchAll,2nd');
            }
        }

        return this;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);
        const regex = this.arguments[1].evaluate(scope);

        if (Typing.isNull(input)) {
            return [];
        } else if (!Typing.isString(input)) {
            throw new Error('fn4 :: regexMatchAll,1st');
        }

        if (Typing.isNull(regex)) {
            return [];
        } else if (!Typing.isString(regex)) {
            throw new Error('fn4 :: regexMatchAll,2nd');
        }

        let flags = '';
        if (this.arguments.length > 2) {
            if (this.arguments[2] instanceof StringLiteral) {
                flags = this.arguments[2].evaluate(scope);

                if (!RegexTestFunction.validateFlags(flags)) {
                    throw new Error('regexMatchAll4');
                }
            } else {
                throw new Error('regexMatchAll3');
            }
        }

        let re;
        try {
            re = new RegExp(regex, flags + 'ug');
        } catch (e) {
            throw new Error('regexMatchAll3');
        }

        const matches = [];

        let nextResult;
        while ((nextResult = re.exec(input)) !== null) {
            matches.push({
                match: nextResult[0],
                idx: nextResult.index,
                captures: nextResult.slice(1).map(c => c === undefined ? null : c),
            });
        }

        return matches;
    };
}