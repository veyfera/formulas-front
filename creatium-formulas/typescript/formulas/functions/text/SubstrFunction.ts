import {
    AbstractFunction, Convertation, Expression, Typing
} from "../../internal.js"

export class SubstrFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 3 };

    constructor(Expr: Expression, args) {
        // Оригинальный объект не мутируем
        args = [...args];

        if (args.length === 1) {
            args.push({ 'type': 'Number', 'value': 0 });
        }

        if (args.length === 2) {
            args.push({ 'type': 'Number', 'value': Typing.INT32_RANGE });
        }

        super(Expr, args);
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        let input = this.arguments[0].evaluate(scope);
        const start = this.arguments[1].evaluate(scope);
        const length = this.arguments[2].evaluate(scope);

        if (Typing.isNumber(input) || Typing.isBoolean(input)) {
            input = Convertation.toString(input);
        } else if (Typing.isNull(input)) {
            return '';
        } else if (!Typing.isString(input) && !Typing.isDate(input)) {
            throw new Error('convert1 :: ' + Typing.getType(input) + ',string');
        }

        if (!Typing.isNumber(start)) {
            throw new Error('fn2 :: substr,2nd,' + Typing.getType(start));
        } else if (!Typing.is32BitInteger(start)) {
            throw new Error('fn3 :: substr,2nd');
        }

        if (!Typing.isNumber(length)) {
            throw new Error('fn2 :: substr,3rd,' + Typing.getType(length));
        } else if (!Typing.is32BitInteger(length)) {
            throw new Error('fn3 :: substr,3rd');
        }

        if (start < 0) {
            throw new Error('substr3');
        }

        if (length < 0) {
            throw new Error('substr5');
        }

        if (Typing.isDate(input)) {
            input = Convertation.toString(input);
        }

        // spread оператор корректно обрабатывает эмодзи
        return [...input].slice(start, start + length).join('');
    };
}