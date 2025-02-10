import {
    AbstractFunction, ExpressionNode, Typing
} from "../../internal.js"

export class ReplaceAllFunction extends AbstractFunction {
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

        let input = this.arguments[0].evaluate(scope);
        const find = this.arguments[1].evaluate(scope);
        const replacement = this.arguments[2].evaluate(scope);

        if (!Typing.isNull(input) && !Typing.isString(input)) {
            throw new Error('fn5 :: replaceAll,1st,' + Typing.getType(input));
        }

        if (!Typing.isNull(find) && !Typing.isString(find)) {
            throw new Error('fn5 :: replaceAll,2nd,' + Typing.getType(find));
        }

        if (!Typing.isNull(replacement) && !Typing.isString(replacement)) {
            throw new Error('fn5 :: replaceAll,3rd,' + Typing.getType(replacement));
        }

        if (Typing.isNull(input) || Typing.isNull(find) || Typing.isNull(replacement)) {
            return null;
        }

        let result = input;

        let findIndex, fromIndex = 0;
        while (1) {
            findIndex = result.indexOf(find, fromIndex);
            if (findIndex < 0) break;
            result = result.substr(0, findIndex) + replacement + result.substr(findIndex + find.length);
            fromIndex = findIndex + replacement.length;
        }

        return result;
    };
}