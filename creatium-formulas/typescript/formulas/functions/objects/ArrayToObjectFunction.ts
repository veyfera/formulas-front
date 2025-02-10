import {
    AbstractFunction, Typing
} from "../../internal.js"

export class ArrayToObjectFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const input = this.arguments[0].evaluate(scope);

        if (Typing.isNull(input)) {
            return null;
        }

        if (Typing.isArray(input)) {
            const result = {};

            let mode = null; // array|object
            for (const item of input) {
                if (mode === 'array') {
                    if (!Typing.isArray(item)) {
                        throw new Error('arrayToObject5 :: array,' + Typing.getType(item));
                    }
                } else if (mode === 'object') {
                    if (!Typing.isObject(item)) {
                        throw new Error('arrayToObject5 :: object,' + Typing.getType(item));
                    }
                } else {
                    if (Typing.isArray(item)) {
                        mode = 'array';
                    } else if (Typing.isObject(item)) {
                        mode = 'object';
                    } else {
                        throw new Error('arrayToObject2 :: ' + Typing.getType(item));
                    }
                }

                if (mode === 'array') {
                    if (item.length !== 2) {
                        throw new Error('arrayToObject4 :: ' + item.length);
                    }

                    if (!Typing.isString(item[0])) {
                        throw new Error('arrayToObject3 :: ' + Typing.getType(item[0]));
                    }

                    result[item[0]] = item[1];
                } else if (mode === 'object') {
                    const count = Object.keys(item).length;
                    if (count !== 2) {
                        throw new Error('arrayToObject7 :: ' + count);
                    }

                    if (!item.hasOwnProperty('k') || !item.hasOwnProperty('v')) {
                        throw new Error('arrayToObject8');
                    }

                    if (!Typing.isString(item.k)) {
                        throw new Error('arrayToObject6 :: ' + Typing.getType(item.k));
                    }

                    result[item.k] = item.v;
                }
            }

            return result;
        } else {
            throw new Error('arrayToObject1 :: ' + Typing.getType(input));
        }
    };
}