import {
    AbstractFunction, Typing
} from "../../internal.js"

export class TrimFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    // https://mongodb.com/docs/manual/reference/operator/aggregation/trim/#std-label-trim-white-space
    static WHITESPACE = (
        "\u{0000}\u{0020}\u{0009}\u{000A}\u{000B}" +
        "\u{000C}\u{000D}\u{00A0}\u{1680}\u{2000}" +
        "\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}" +
        "\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}"
    );

    trim(str, charlist) {
        let start = 0;
        let end = str.length;

        while (start < end && charlist.indexOf(str[start]) >= 0) {
            ++start;
        }

        while (end > start && charlist.indexOf(str[end - 1]) >= 0) {
            --end;
        }

        return (start > 0 || end < str.length) ? str.substring(start, end) : str;
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        } else if (Typing.isString(input)) {
            return this.trim(input, TrimFunction.WHITESPACE);
        } else {
            throw new Error('fn6 :: trim,' + Typing.getType(input));
        }
    };
}