import {
    Typing, AbstractFunction, ExpressionNode, NullLiteral
} from "../../internal.js"

export class DateAddFunction extends AbstractFunction {
    protected minArguments() { return 3 };
    protected maxArguments() { return 3 };

    optimize(): ExpressionNode
    {
        if (this.arguments[0] instanceof NullLiteral) {
            return this.arguments[0].optimize();
        }

        return super.optimize();
    }

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);
        const unit = this.arguments[1].evaluate(scope);

        if (Typing.isNull(unit)) {
            return null;
        } else if (Typing.isString(unit)) {
            if (!['year', 'quarter', 'week', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'].includes(unit)) {
                throw new Error('dateAdd3');
            }
        } else {
            throw new Error('dateAdd1 :: ' + Typing.getType(unit));
        }

        if (Typing.isNull(input)) {
            return null;
        } else if (Typing.isDate(input)) {
            const amount = this.arguments[2].evaluate(scope);

            if (Typing.isNull(amount)) {
                return null;
            } else if (Typing.isNumber(amount)) {
                if (Math.trunc(amount) === amount) {
                    if (unit === 'year') {
                        return this.addMonths(input, amount * 12);
                    } else if (unit === 'quarter') {
                        return this.addMonths(input, amount * 3);
                    } else if (unit === 'week') {
                        return this.addDays(input, amount * 7);
                    } else if (unit === 'month') {
                        return this.addMonths(input, amount);
                    } else if (unit === 'day') {
                        return this.addDays(input, amount);
                    } else if (unit === 'hour') {
                        return this.addMinutes(input, amount * 60);
                    } else if (unit === 'minute') {
                        return this.addMinutes(input, amount);
                    } else if (unit === 'second') {
                        return this.addMilliseconds(input, amount * 1000);
                    } else if (unit === 'millisecond') {
                        return this.addMilliseconds(input, amount);
                    } else {
                        throw new Error('dateAdd3');
                    }
                } else {
                    throw new Error('dateAdd4');
                }
            } else {
                throw new Error('dateAdd4');
            }
        } else {
            throw new Error('dateAdd2');
        }
    }

    addMonths(date: Date, amount: number) {
        const endDate = new Date(date);
        const originalDay = endDate.getUTCDate();

        endDate.setUTCMonth(endDate.getUTCMonth() + amount);
        if (endDate.getUTCDate() !== originalDay) {
            // Если был, например, день 31, мы добавили месяц и стал 01, то отматываем
            endDate.setUTCDate(0);
        }

        return endDate;
    }

    addDays(date: Date, amount: number) {
        const endDate = new Date(date);
        endDate.setUTCDate(endDate.getUTCDate() + amount);
        return endDate;
    }

    addMinutes(date: Date, amount: number) {
        return this.addMilliseconds(date, amount * 1000 * 60);
    }

    addMilliseconds(date: Date, amount: number) {
        return new Date(+date + amount);
    }
}