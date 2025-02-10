import {
    Typing, AbstractFunction, ExpressionNode, NullLiteral
} from "../../internal.js"

export class DateSubtractFunction extends AbstractFunction {
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
                throw new Error('dateSubtract3');
            }
        } else {
            throw new Error('dateSubtract1 :: ' + Typing.getType(unit));
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
                        return this.subtractMonths(input, amount * 12);
                    } else if (unit === 'quarter') {
                        return this.subtractMonths(input, amount * 3);
                    } else if (unit === 'week') {
                        return this.subtractDays(input, amount * 7);
                    } else if (unit === 'month') {
                        return this.subtractMonths(input, amount);
                    } else if (unit === 'day') {
                        return this.subtractDays(input, amount);
                    } else if (unit === 'hour') {
                        return this.subtractMinutes(input, amount * 60);
                    } else if (unit === 'minute') {
                        return this.subtractMinutes(input, amount);
                    } else if (unit === 'second') {
                        return this.subtractMilliseconds(input, amount * 1000);
                    } else if (unit === 'millisecond') {
                        return this.subtractMilliseconds(input, amount);
                    } else {
                        throw new Error('dateSubtract3');
                    }
                } else {
                    throw new Error('dateSubtract4');
                }
            } else {
                throw new Error('dateSubtract4');
            }
        } else {
            throw new Error('dateSubtract2');
        }
    }

    subtractMonths(date: Date, amount: number) {
        const endDate = new Date(date);
        const originalDay = endDate.getUTCDate();

        endDate.setUTCMonth(endDate.getUTCMonth() - amount);
        if (endDate.getUTCDate() !== originalDay) {
            // Если был, например, день 31, мы отняли месяц и стал 01, то отнимаем еще
            endDate.setUTCDate(0);
        }

        return endDate;
    }

    subtractDays(date: Date, amount: number) {
        const endDate = new Date(date);
        endDate.setUTCDate(endDate.getUTCDate() - amount);
        return endDate;
    }

    subtractMinutes(date: Date, amount: number) {
        return this.subtractMilliseconds(date, amount * 1000 * 60);
    }

    subtractMilliseconds(date: Date, amount: number) {
        return new Date(+date - amount);
    }
}