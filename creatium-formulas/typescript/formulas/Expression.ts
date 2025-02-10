import {
    NumberLiteral, StringLiteral, NullLiteral, BooleanLiteral, Identifier, ObjectExpression, ArrayExpression,
    MemberExpression, IfFunction, ModFunction, MultiplyFunction, SumFunction, ToBooleanFunction, ToStringFunction,
    JoinFunction, CallFunction, NotFunction, SubtractFunction, DivideFunction, EqualFunction, NotEqualFunction,
    GreaterFunction, GreaterOrEqualFunction, LessFunction, LessOrEqualFunction, OrFunction, AndFunction, MapFunction,
    FilterFunction, ReduceFunction, CountFunction, ReverseFunction, MergeFunction, ToNumberFunction, TypeFunction,
    NowFunction, ToDateFunction, LengthFunction, SubstrFunction, LocateFunction, RoundFunction, FloorFunction,
    CeilFunction, AbsFunction, RangeFunction, TrimFunction, TrimStartFunction, TrimEndFunction, Convertation,
    ExpressionNode, AbstractFunction, NullCoalescingFunction, DateLiteral, RandomFunction, Typing, Comparison,
    SplitFunction, SortFunction, SliceFunction, LetFunction, ErrorTranslator, MinFunction, MaxFunction, PowFunction,
    SqrtFunction, ReplaceFunction, ReplaceAllFunction, LogFunction, LowerFunction, UpperFunction, InFunction,
    RegexTestFunction, RegexMatchFunction, RegexMatchAllFunction, ExpFunction, TruncFunction, AcosFunction,
    AcoshFunction, AsinFunction, AsinhFunction, Atan2Function, AtanFunction, AtanhFunction, CosFunction, CoshFunction,
    SinFunction, SinhFunction, TanFunction, TanhFunction, IndexOfFunction, ExistsFunction, UniqueFunction,
    ObjectToArrayFunction, ArrayToObjectFunction, PickKeysFunction, DateAddFunction, DateSubtractFunction, ToTable
} from "./internal.js"

import { AstNode, ExpressionAst } from "./tsd.js"

export class Expression {
    static ErrorTranslator = ErrorTranslator;
    static Typing = Typing;
    static Comparison = Comparison;

    static NODES = {
        'Number': NumberLiteral,
        'String': StringLiteral,
        'Date': DateLiteral,
        'Boolean': BooleanLiteral,
        'Null': NullLiteral,
        'Identifier': Identifier,
        'ObjectExpression': ObjectExpression,
        'ArrayExpression': ArrayExpression,
        'MemberExpression': MemberExpression,
    };

    static FUNCTIONS = {
        'if': IfFunction,
        'mod': ModFunction,
        'multiply': MultiplyFunction,
        'sum': SumFunction,
        'round': RoundFunction,
        'floor': FloorFunction,
        'ceil': CeilFunction,
        'abs': AbsFunction,
        'random': RandomFunction,
        'min': MinFunction,
        'max': MaxFunction,
        'pow': PowFunction,
        'sqrt': SqrtFunction,
        'log': LogFunction,
        'exp': ExpFunction,
        'trunc': TruncFunction,
        'acos': AcosFunction,
        'acosh': AcoshFunction,
        'asin': AsinFunction,
        'asinh': AsinhFunction,
        'atan2': Atan2Function,
        'atan': AtanFunction,
        'atanh': AtanhFunction,
        'cos': CosFunction,
        'cosh': CoshFunction,
        'sin': SinFunction,
        'sinh': SinhFunction,
        'tan': TanFunction,
        'tanh': TanhFunction,
        'toBoolean': ToBooleanFunction,
        'toString': ToStringFunction,
        'toNumber': ToNumberFunction,
        'toDate': ToDateFunction,
        'join': JoinFunction,
        'call': CallFunction,
        'not': NotFunction,
        'let': LetFunction,
        'map': MapFunction,
        'filter': FilterFunction,
        'reduce': ReduceFunction,
        'range': RangeFunction,
        'count': CountFunction,
        'reverse': ReverseFunction,
        'merge': MergeFunction,
        'sort': SortFunction,
        'slice': SliceFunction,
        'indexOf': IndexOfFunction,
        'unique': UniqueFunction,
        'type': TypeFunction,
        'exists': ExistsFunction,
        'now': NowFunction,
        'dateAdd': DateAddFunction,
        'dateSubtract': DateSubtractFunction,
        'length': LengthFunction,
        'substr': SubstrFunction,
        'locate': LocateFunction,
        'trim': TrimFunction,
        'trimStart': TrimStartFunction,
        'trimEnd': TrimEndFunction,
        'split': SplitFunction,
        'replace': ReplaceFunction,
        'replaceAll': ReplaceAllFunction,
        'lower': LowerFunction,
        'upper': UpperFunction,
        'regexTest': RegexTestFunction,
        'regexMatch': RegexMatchFunction,
        'regexMatchAll': RegexMatchAllFunction,
        'objectToArray': ObjectToArrayFunction,
        'arrayToObject': ArrayToObjectFunction,
        'pickKeys': PickKeysFunction,
    };

    static UNARY_OPERATORS = {
        '+': SumFunction,
        '-': SubtractFunction,
    };

    static BINARY_OPERATORS = {
        '&': JoinFunction,
        '+': SumFunction,
        '-': SubtractFunction,
        '*': MultiplyFunction,
        '/': DivideFunction,
        '%': ModFunction,
        '==': EqualFunction,
        '!=': NotEqualFunction,
        '>': GreaterFunction,
        '>=': GreaterOrEqualFunction,
        '<': LessFunction,
        '<=': LessOrEqualFunction,
        'or': OrFunction,
        'and': AndFunction,
        '??': NullCoalescingFunction,
        'in': InFunction,
    };

    private ast: ExpressionAst;

    /** Режим без ограничений по выполнению */
    static LIMIT_MODE_NONE = 0;

    /** Выполнение ограничено 10 000 вызовами функций */
    static LIMIT_MODE_10K = 1;

    /** Выполнение ограничено 1 000 000 вызовов функций */
    static LIMIT_MODE_1M = 2;

    protected limitMode: number = 0;

    constructor(ast: ExpressionAst, limitMode: number) {
        if (limitMode === undefined) {
            throw new Error('limitNode is required');
        }

        this.ast = ast;
        this.limitMode = limitMode;
    }

    isEmpty() {
        return this.ast.error === null && this.ast.source === null;
    }

    makeNode(source: AstNode) {
        if (!source || !source.hasOwnProperty('type')) {
            throw new Error('Node without type');
        }

        if (source.type === 'CallExpression') {
            if (!source.hasOwnProperty('arguments')) {
                throw new Error('Call expression without arguments');
            }

            if (!source.hasOwnProperty('callee')) {
                throw new Error('Call expression without callee');
            }

            if (!Expression.FUNCTIONS[source.callee]) {
                throw new Error('Unknown function call');
            }

            return new Expression.FUNCTIONS[source.callee](this, source.arguments);
        } else if (source.type === 'UnaryExpression') {
            if (!source.hasOwnProperty('argument')) {
                throw new Error('Unary operator without argument');
            }

            if (!source.hasOwnProperty('operator')) {
                throw new Error('Unary operator without operator');
            }

            if (source.operator === '+') {
                return new SumFunction(this, [{
                    'type': 'ArrayExpression',
                    'elements': [
                        {
                            'type': 'Number',
                            'value': 0,
                            'location': [0, 0],
                        },
                        source.argument
                    ],
                    'location': [0, 0],
                }]);
            } else if (source.operator === '-') {
                return new SubtractFunction(this, [
                    {
                        'type': 'Number',
                        'value': 0,
                        'location': [0, 0],
                    },
                    source.argument
                ]);
            } else if (source.operator === '?') {
                return new NullCoalescingFunction(this, [
                    source.argument, {'type': 'Null', 'location': [0, 0]}
                ]);
            } else {
                throw new Error('Unknown unary operator');
            }
        } else if (source.type === 'BinaryExpression') {
            if (!source.hasOwnProperty('left')) {
                throw new Error('Binary operator without left');
            }

            if (!source.hasOwnProperty('right')) {
                throw new Error('Binary operator without right');
            }

            if (!Expression.BINARY_OPERATORS[source.operator]) {
                throw new Error('Unknown binary operator');
            }

            let args;
            if (['&', '+', '*'].includes(source.operator)) {
                // Для некоторых операторов мы аргументы оборачиваем в массив
                args = [{
                    'type': 'ArrayExpression',
                    'elements': [source.left, source.right],
                    'location': [0, 0],
                }];
            } else {
                args = [source.left, source.right];
            }

            return new Expression.BINARY_OPERATORS[source.operator](this, args);
        }

        if (!Expression.NODES[source.type]) {
            throw new Error('Unknown node type');
        }

        // @ts-ignore непонятная ошибка
        return new Expression.NODES[source.type](this, source);
    }

    public evaluationCounter = 0;

    protected resetEvaluationLimits() {
        this.evaluationCounter = 0;
    }

    public checkEvaluationLimits(node: ExpressionNode) {
        if (this.limitMode && node instanceof AbstractFunction) {
            this.evaluationCounter++;

            if (this.limitMode === Expression.LIMIT_MODE_10K && this.evaluationCounter > 10_000) {
                throw new Error('Limit 10k exceeded');
            }

            if (this.limitMode === Expression.LIMIT_MODE_1M && this.evaluationCounter > 1_000_000) {
                throw new Error('Limit 1 million exceeded');
            }
        }
    }

    public evaluate(scope: any) {
        this.resetEvaluationLimits();

        const started = Date.now();

        if (this.isEmpty()) {
            return {
                error: null,
                result: null,
                time: Date.now() - started,
            };
        }

        if (this.ast.error === null) {
            try {
                const rootNode = this.makeNode(this.ast.source);

                try {
                    const optimizedNode = rootNode.optimize();

                    try {
                        return {
                            error: null,
                            result: optimizedNode.evaluate(scope),
                            time: Date.now() - started,
                        };
                    } catch (e) {
                        return {
                            error: 'evaluate :: ' + e.message,
                            result: null,
                            time: Date.now() - started,
                        };
                    }
                } catch (e) {
                    return {
                        error: 'optimize :: ' + e.message,
                        result: null,
                        time: Date.now() - started,
                    };
                }
            } catch (e) {
                return {
                    error: 'validate :: ' + e.message,
                    result: null,
                    time: Date.now() - started,
                };
            }
        } else {
            return {
                error: 'parse :: ' + this.ast.error.message,
                result: null,
                time: Date.now() - started,
            };
        }
    }

    public evaluateToBoolean(scope: any) {
        const output = this.evaluate(scope);
        if (output.error) return output;

        try {
            return {
                error: null,
                result: Convertation.toBoolean(output.result)
            };
        } catch (e) {
            return {
                error: 'finalize :: ' + e.message,
                result: null
            };
        }
    }

    public evaluateToString(scope: any) {
        const output = this.evaluate(scope);
        if (output.error) return output;

        try {
            return {
                error: null,
                result: Convertation.toString(output.result)
            };
        } catch (e) {
            return {
                error: 'finalize :: ' + e.message,
                result: null
            };
        }
    }

    public evaluateToNumber(scope: any) {
        const output = this.evaluate(scope);
        if (output.error) return output;

        try {
            return {
                error: null,
                result: Convertation.toNumber(output.result)
            };
        } catch (e) {
            return {
                error: 'finalize :: ' + e.message,
                result: null
            };
        }
    }

    public evaluateToTable(scope: any) {
        const output = this.evaluate(scope);
        if (output.error) return output;

        try {
            return {
                error: null,
                result: ToTable.perform(output.result)
            };
        } catch (e) {
            return {
                error: 'finalize :: ' + e.message,
                result: null
            };
        }
    }

    static prettyPrint(input, indent: string|false = '') {
        const noIndent = indent === false;
        const nextIndent = noIndent ? false : indent + '  ';

        if (Typing.isObject(input)) {
            if (Object.keys(input).length === 0) return '{}';
            else {
                const lines = [];

                for (const key in input) {
                    lines.push([
                        noIndent ? '' : nextIndent,
                        JSON.stringify(key),
                        ': ',
                        Expression.prettyPrint(input[key], nextIndent)
                    ].join(''));
                }

                return [
                    noIndent ? '{' : '{\n',
                    lines.join(noIndent ? ', ' : ',\n'),
                    noIndent ? '}' : '\n' + indent + '}',
                ].join('');
            }
        } else if (Typing.isArray(input)) {
            if (input.length === 0) return '[]';
            else {
                const lines = [];

                for (const value of input) {
                    lines.push([
                        noIndent ? '' : nextIndent,
                        Expression.prettyPrint(value, nextIndent)
                    ].join(''));
                }

                return [
                    noIndent ? '[' : '[\n',
                    lines.join(noIndent ? ', ' : ',\n'),
                    noIndent ? ']' : '\n' + indent + ']',
                ].join('');
            }
        } else if (Typing.isDate(input)) {
            return '#' + Convertation.toString(input) + '#';
        } else if (Typing.isString(input)) {
            return JSON.stringify(Convertation.toString(input));
        } else if (Typing.isNumber(input)) {
            return Convertation.toString(input);
        } else if (Typing.isNull(input)) {
            return 'null';
        } else if (Typing.isBoolean(input)) {
            return Convertation.toString(input);
        } else {
            throw new Error('Unknown type');
        }
    }

    static encodeTypes(object) {
        if (Typing.isDate(object)) {
            return {
                __formula_encoded_type__: 'date',
                date: Convertation.toString(object),
            };
        } else if (Typing.isArray(object)) {
            const array2 = [...object];

            let index = 0;
            for (const element of array2) {
                array2[index++] = this.encodeTypes(element);
            }

            return array2;
        } else if (Typing.isObject(object)) {
            const object2 = { ...object }

            for (const key in object2) {
                object2[key] = this.encodeTypes(object2[key]);
            }

            return object2;
        } else if (Number.isNaN(object)) {
            return {
                __formula_encoded_type__: 'NaN',
            };
        } else if (object === Infinity) {
            return {
                __formula_encoded_type__: 'Infinity',
            };
        } else if (object === -Infinity) {
            return {
                __formula_encoded_type__: '-Infinity',
            };
        } else {
            return object;
        }
    }

    static encodeDataToJSON(object: any, pretty = false) {
        return JSON.stringify(this.encodeTypes(object), null, pretty ? 2 : null);
    }

    static decodeTypes(object) {
        if (object?.__formula_encoded_type__ !== undefined) {
            if (object.__formula_encoded_type__ === 'date') {
                // timestamp стал deprecated с 6 ноября 2022 года
                return Convertation.toDate(object.date || object.timestamp);
            } else if (object.__formula_encoded_type__ === 'NaN') {
                return NaN;
            } else if (object.__formula_encoded_type__ === 'Infinity') {
                return Infinity;
            } else if (object.__formula_encoded_type__ === '-Infinity') {
                return -Infinity;
            } else return object;
        } else if (Typing.isArray(object)) {
            const array2 = [...object];

            let index = 0;
            for (const element of array2) {
                array2[index++] = this.decodeTypes(element);
            }

            return array2;
        } else if (Typing.isObject(object)) {
            const object2 = { ...object }

            for (const key in object2) {
                object2[key] = this.decodeTypes(object2[key]);
            }

            return object2;
        } else {
            return object;
        }
    }

    static decodeDataFromJSON(source: string) {
        return this.decodeTypes(JSON.parse(source));
    }

    static deepClone(object: any) {
        // Эту функцию можно очень сильно оптимизировать, если не делать реальную конвертацию в JSON,
        // а просто обойти дерево и создать копии всех объектов, массивов и дат
        return this.decodeDataFromJSON(this.encodeDataToJSON(object));
    }

    public preEvaluate(scope: any) {
        const started = Date.now();

        if (this.isEmpty()) {
            return {
                error: null,
                result: null,
                time: Date.now() - started,
            };
        }

        if (this.ast.error === null) {
            try {
                let rootNode = this.makeNode(this.ast.source);

                try {
                    rootNode = rootNode.preEvaluate([], scope);
                } catch (e) {
                    return {
                        error: 'preeval :: ' + e.message,
                        result: null
                    };
                }

                try {
                    return {
                        error: null,
                        result: rootNode.toCode()
                    };
                } catch (e) {
                    return {
                        error: 'convert :: ' + e.message,
                        result: null
                    };
                }
            } catch (e) {
                return {
                    error: 'validate :: ' + e.message,
                    result: null,
                    time: Date.now() - started,
                };
            }
        } else {
            return {
                error: 'parse :: ' + this.ast.error.message,
                result: null,
                time: Date.now() - started,
            };
        }
    }
}
