const should = require('should/as-function');

const { Expression, parseExpression } = require("../dist/editor.cjs");
const php_parse = require('./php.parse');

function factory(group) {
    return function () {
        for (const code in group) {
            const expectation = group[code];

            const results = { php: null, node: null };
            before(async function () {
                results.php = await php_parse('parseExpression', { code });

                const node_output = parseExpression(code);
                results.node = {
                    result: node_output.source,
                    error: node_output.error
                };
            });

            for (const target of ['php', 'node']) {
                specify(code + ', ' + target, async () => {
                    console.log(results[target]);

                    if (expectation instanceof Error) {
                        should(results[target].result).be.a.null();
                        should(results[target].error).not.be.a.null();

                        should(results[target].error.message).equal(
                            expectation.message,
                            `Different error from ${JSON.stringify(results[target].error)}`
                        );

                        const fullError = `parseError :: ${results[target].error.message}`;
                        should(Expression.ErrorTranslator.hasTranslationFor(fullError)).be.true(
                            'Missing translation for ' + fullError
                        );
                    } else {
                        should(results[target].error).be.a.null();
                        should(results[target].result).deepEqual(
                            expectation,
                            `Different result from ${JSON.stringify(results[target])}`
                        );
                    }
                });
            }
        }
    }
}

describe('parser', () => {
    describe('Пустой код', factory({
        '': null,
        ' ': null,
        ' \n // 123  \n  /*  */ \n  ': null,
    }));

    describe('Простые типы', factory({
        '1': { type: 'Number', value: 1, location: [0, 1] },
        '1.2345': { type: 'Number', value: 1.2345, location: [0, 6] },
        '1.2345e5': { type: 'Number', value: 123450, location: [0, 8] },

        // Храним строкой, чтобы в JSON можно было конвертировать дерево
        'NaN': { type: 'Number', value: 'NaN', location: [0, 3] },
        'Infinity': { type: 'Number', value: 'Infinity', location: [0, 8] },

        "''": { type: 'String', value: "", location: [0, 2] },
        '""': { type: 'String', value: "", location: [0, 2] },
        '"a"': { type: 'String', value: "a", location: [0, 3] },
        '"a\\b\\""': { type: 'String', value: "a\b\"", location: [0, 7] },
        '"a\\n\\""': { type: 'String', value: "a\n\"", location: [0, 7] },
        '"a\\f\\""': { type: 'String', value: "a\f\"", location: [0, 7] },
        '"a\\b\\"c"': { type: 'String', value: "a\b\"c", location: [0, 8] },
        "'a'": { type: 'String', value: "a", location: [0, 3] },
        "'a\\n\\''": { type: 'String', value: "a\n\'", location: [0, 7] },
        "'привет'": { type: 'String', value: "привет", location: [0, 8] },

        '/a/': { type: 'String', value: "a", location: [0, 3] },
        '/a\\b\\"/': { type: 'String', value: "a\\b\\\"", location: [0, 7] },
        '/\\w\\n/': { type: 'String', value: "\\w\\n", location: [0, 6] },

        'true': { type: 'Boolean', value: true, location: [0, 4] },
        'false': { type: 'Boolean', value: false, location: [0, 5] },

        '#2022-07-02 13:38:47#': {
            type: 'Date',
            value: '2022-07-02T13:38:47.000Z',
            location: [0, 21]
        },

        '.23': new Error('parse2 :: .'),
        '2 + .23': new Error('parse2 :: .'),
        '1_000': new Error('parse6 :: 1_'),
        '100e1000': new Error('parse7'),
        '#12312#': new Error('parse17'),
    }));

    describe('Идентификаторы', factory({
        'x': { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
        '_x_': { type: 'Identifier', column: false, name: '_x_', location: [0, 3] },
        '$x$': { type: 'Identifier', column: false, name: '$x$', location: [0, 3] },

        '@x': { type: 'Identifier', column: true, name: 'x', location: [0, 2] },
        '@_abc': { type: 'Identifier', column: true, name: '_abc', location: [0, 5] },

        'a@a': new Error('parse2 :: @'),
        '@a@': new Error('parse2 :: @'),
        'a@': new Error('parse2 :: @'),
    }));

    describe('Скобки', factory({
        '()': null,
        ' ( ) ': null,

        '(1, 2)': new Error('parse8 :: ('),
        '().test': new Error('parse2 :: .'),
        '().()': new Error('parse2 :: .'),
        '()()': new Error('parse2 :: ('),
    }));

    describe('Специальные идентификаторы', factory({
        'this': { type: 'Identifier', column: false, name: 'this', location: [0, 4] },
        'typeof': { type: 'Identifier', column: false, name: 'typeof', location: [0, 6] },
        'void': { type: 'Identifier', column: false, name: 'void', location: [0, 4] },
        'delete': { type: 'Identifier', column: false, name: 'delete', location: [0, 6] },
        'if': { type: 'Identifier', column: false, name: 'if', location: [0, 2] },
        'instanceof': { type: 'Identifier', column: false, name: 'instanceof', location: [0, 10] },
    }));

    describe('Массивы', factory({
        '[]': {
            type: 'ArrayExpression',
            elements: [],
            location: [0, 2]
        },

        '[[]]': {
            type: 'ArrayExpression',
            elements: [{
                type: 'ArrayExpression',
                elements: [],
                location: [1, 3]
            }],
            location: [0, 4]
        },

        '[ [  ] ]': {
            type: 'ArrayExpression',
            elements: [{
                type: 'ArrayExpression',
                elements: [],
                location: [2, 6]
            }],
            location: [0, 8]
        },

        '[1, x, "a"]': {
            type: 'ArrayExpression',
            elements: [
                { type: 'Number', value: 1, location: [1, 2] },
                { type: 'Identifier', column: false, name: 'x', location: [4, 5] },
                { type: 'String', value: 'a', location: [7, 10] }
            ],
            location: [0, 11]
        },

        '[1, x, "a", ]': {
            type: 'ArrayExpression',
            elements: [
                { type: 'Number', value: 1, location: [1, 2] },
                { type: 'Identifier', column: false, name: 'x', location: [4, 5] },
                { type: 'String', value: 'a', location: [7, 10] }
            ],
            location: [0, 13]
        },

        '[1 2]': new Error('parse5 :: ,'),
        '[1, , 2]': new Error('parse2 :: ,'),
        '[1,2][]': new Error('parse2 :: ]'),
        '[1,2][': new Error('parse8 :: ['),
        '[1,2][)': new Error('parse8 :: ['),
        '[1,2': new Error('parse5 :: ]'),
        '[1,2)': new Error('parse5 :: ,'),
        '[,1]': new Error('parse2 :: ,'),
        '[,,1]': new Error('parse2 :: ,'),
    }));

    describe('Чтение свойств простых типов', factory({
        '1.length': new Error('parse6 :: 1.l'),

        '(1).length': {
            type: 'MemberExpression',
            object: { type: 'Number', value: 1, location: [1, 2] },
            property: { type: 'String', value: 'length', location: [4, 10] },
            location: [1, 10]
        },

        '"a".length': {
            type: 'MemberExpression',
            object: { type: 'String', value: 'a', location: [0, 3] },
            property: { type: 'String', value: 'length', location: [4, 10] },
            location: [0, 10]
        },

        'true.length': {
            type: 'MemberExpression',
            object: { type: 'Boolean', value: true, location: [0, 4] },
            property: { type: 'String', value: 'length', location: [5, 11] },
            location: [0, 11]
        },

        'false.length': {
            type: 'MemberExpression',
            object: { type: 'Boolean', value: false, location: [0, 5] },
            property: { type: 'String', value: 'length', location: [6, 12] },
            location: [0, 12]
        },

        'null.length': {
            type: 'MemberExpression',
            object: { type: 'Null', location: [0, 4] },
            property: { type: 'String', value: 'length', location: [5, 11] },
            location: [0, 11]
        },

        // Чтение свойств массивов через точку
        '[].length': {
            type: 'MemberExpression',
            object: {
                type: 'ArrayExpression',
                elements: [],
                location: [0, 2]
            },
            property: { type: 'String', value: 'length', location: [3, 9] },
            location: [0, 9]
        },

        '[].1': new Error('parse2 :: 1'),
        'abc.1': new Error('parse2 :: 1'),
    }));

    describe('Вызовы методов', factory({
        '"test".toString()': {
            type: 'CallExpression',
            arguments: [
                { type: 'String', value: 'test', location: [0, 6] }
            ],
            callee: 'toString',
            location: [7, 15]
        },

        'test.toString()': {
            type: 'CallExpression',
            arguments: [
                { type: 'Identifier', column: false, name: 'test', location: [0, 4] }
            ],
            callee: 'toString',
            location: [5, 13]
        },

        'true.toString()': {
            type: 'CallExpression',
            arguments: [
                { type: 'Boolean', value: true, location: [0, 4] }
            ],
            callee: 'toString',
            location: [5, 13]
        },

        'false.toString()': {
            type: 'CallExpression',
            arguments: [
                { type: 'Boolean', value: false, location: [0, 5] }
            ],
            callee: 'toString',
            location: [6, 14]
        },

        'a.toString()': {
            type: 'CallExpression',
            arguments: [
                { type: 'Identifier', column: false, name: 'a', location: [0, 1] }
            ],
            callee: 'toString',
            location: [2, 10]
        },

        'a.join()': {
            type: 'CallExpression',
            arguments: [
                { type: 'Identifier', column: false, name: 'a', location: [0, 1] }
            ],
            callee: 'join',
            location: [2, 6]
        },

        'a.join(1)': {
            type: 'CallExpression',
            arguments: [
                { type: 'Identifier', column: false, name: 'a', location: [0, 1] },
                { type: 'Number', value: 1, location: [7, 8] }
            ],
            callee: 'join',
            location: [2, 6]
        },

        'sum(1, 2).toString()': {
            type: 'CallExpression',
            arguments: [
                {
                    type: 'CallExpression',
                    arguments: [
                        { type: 'Number', value: 1, location: [4, 5] },
                        { type: 'Number', value: 2, location: [7, 8] }
                    ],
                    callee: 'sum',
                    location: [0, 3]
                }
            ],
            callee: 'toString',
            location: [10, 18]
        },

        'a[1].b.sum()': {
            type: 'CallExpression',
            arguments: [
                {
                    type: 'MemberExpression',
                    object: {
                        type: 'MemberExpression',
                        object: {
                            type: 'Identifier',
                            column: false,
                            name: 'a',
                            location: [0, 1]
                        },
                        property: { type: 'Number', value: 1, location: [2, 3] },
                        location: [0, 4]
                    },
                    property: { type: 'String', value: 'b', location: [5, 6] },
                    location: [0, 6]
                }
            ],
            callee: 'sum',
            location: [7, 10]
        },

        '(123).sum().join()': {
            type: 'CallExpression',
            arguments: [
                {
                    type: 'CallExpression',
                    arguments: [
                        { type: 'Number', value: 123, location: [1, 4] }
                    ],
                    callee: 'sum',
                    location: [6, 9]
                }
            ],
            callee: 'join',
            location: [12, 16]
        },

        '(123).sum(456).split(d.sum())': {
            type: 'CallExpression',
            arguments: [
                {
                    type: 'CallExpression',
                    arguments: [
                        { type: 'Number', value: 123, location: [1, 4] },
                        { type: 'Number', value: 456, location: [10, 13] }
                    ],
                    callee: 'sum',
                    location: [6, 9]
                },
                {
                    type: 'CallExpression',
                    arguments: [
                        {
                            type: 'Identifier',
                            column: false,
                            name: 'd',
                            location: [21, 22]
                        }
                    ],
                    callee: 'sum',
                    location: [23, 26]
                }
            ],
            callee: 'split',
            location: [15, 20]
        },

        'abc.def()': new Error('parse14 :: def'),
    }));

    describe('Бинарные операторы', factory({
        ...(function (obj) {
            for (const operator of Object.keys(Expression.BINARY_OPERATORS)) {
                obj[`1 ${operator} 2`] = {
                    type: 'BinaryExpression',
                    operator: operator,
                    left: { type: 'Number', value: 1, location: [0, 1] },
                    right: { type: 'Number', value: 2, location: [operator.length + 3, operator.length + 4] },
                    location: [2, 2 + operator.length]
                };
            }
            return obj;
        })({}),

        ...(function (obj) {
            for (const operator of Object.keys(Expression.BINARY_OPERATORS)) {
                obj[`a ${operator} b`] = {
                    type: 'BinaryExpression',
                    operator: operator,
                    left: { type: 'Identifier', column: false, name: 'a', location: [0, 1] },
                    right: { type: 'Identifier', column: false, name: 'b', location: [operator.length + 3, operator.length + 4] },
                    location: [2, 2 + operator.length]
                };
            }
            return obj;
        })({}),

        '1 | 2': new Error('parse2 :: |'),
        '1 ^ 2': new Error('parse2 :: ^'),
        '1 << 2': new Error('parse3 :: <'),
        '1 >> 2': new Error('parse3 :: >'),
        '1 >>> 2': new Error('parse3 :: >'),
        '1 === 2': new Error('parse3 :: =='),
        '1 !== 2': new Error('parse3 :: !='),
        '1 ??? 2': new Error('parse2 :: 2'), // Странная ошибка, но ок

        '1 + 2 * 3': {
            type: 'BinaryExpression',
            operator: '+',
            left: { type: 'Number', value: 1, location: [0, 1] },
            right: {
                type: 'BinaryExpression',
                operator: '*',
                left: { type: 'Number', value: 2, location: [4, 5] },
                right: { type: 'Number', value: 3, location: [8, 9] },
                location: [6, 7]
            },
            location: [2, 3]
        },

        '(1 + 2) * 3': {
            type: 'BinaryExpression',
            operator: '*',
            left: {
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'Number', value: 1, location: [1, 2] },
                right: { type: 'Number', value: 2, location: [5, 6] },
                location: [3, 4]
            },
            right: { type: 'Number', value: 3, location: [10, 11] },
            location: [8, 9]
        },

        '1 & 2 > 3 + 4 & 5': {
            type: 'BinaryExpression',
            operator: '>',
            left: {
                type: 'BinaryExpression',
                operator: '&',
                left: { type: 'Number', value: 1, location: [0, 1] },
                right: { type: 'Number', value: 2, location: [4, 5] },
                location: [2, 3]
            },
            right: {
                type: 'BinaryExpression',
                operator: '&',
                left: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: { type: 'Number', value: 3, location: [8, 9] },
                    right: { type: 'Number', value: 4, location: [12, 13] },
                    location: [10, 11]
                },
                right: { type: 'Number', value: 5, location: [16, 17] },
                location: [14, 15]
            },
            location: [6, 7]
        },

        // Право-ассоциативный оператор
        '1 ?? 2 ?? 3': {
            type: 'BinaryExpression',
            operator: '??',
            left: { type: 'Number', value: 1, location: [0, 1] },
            right: {
                type: 'BinaryExpression',
                operator: '??',
                left: { type: 'Number', value: 2, location: [5, 6] },
                right: { type: 'Number', value: 3, location: [10, 11] },
                location: [7, 9]
            },
            location: [2, 4]
        },
    }));

    describe('Унарные операторы', factory({
        '+ 1': {
            type: 'UnaryExpression',
            operator: '+',
            argument: { type: 'Number', value: 1, location: [2, 3] },
            location: [0, 1]
        },

        '- 1': {
            type: 'UnaryExpression',
            operator: '-',
            argument: { type: 'Number', value: 1, location: [2, 3] },
            location: [0, 1]
        },

        '! 2': new Error('parse2 :: !'),
        '~ 2': new Error('parse2 :: ~'),
        '? 2': new Error('parse2 :: 2'),

        '- (1)': {
            type: 'UnaryExpression',
            operator: '-',
            argument: { type: 'Number', value: 1, location: [3, 4] },
            location: [0, 1]
        },

        '- (1 + 2)': {
            type: 'UnaryExpression',
            operator: '-',
            argument: {
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'Number', value: 1, location: [3, 4] },
                right: { type: 'Number', value: 2, location: [7, 8] },
                location: [5, 6]
            },
            location: [0, 1]
        },

        '1() ?': new Error('parse13'),
        'x?.y ?': new Error('parse2 :: .'),
        'x?[1] ?': new Error('parse2 :: ['),
        'x()?.y ?': new Error('parse14 :: x'),

        '1 ?': {
            type: 'UnaryExpression',
            operator: '?',
            argument: { type: 'Number', value: 1, location: [0, 1] },
            location: [2, 3]
        },

        'a?': {
            type: 'UnaryExpression',
            operator: '?',
            argument: { type: 'Identifier', column: false, name: 'a', location: [0, 1] },
            location: [1, 2]
        },

        'a ?': {
            type: 'UnaryExpression',
            operator: '?',
            argument: { type: 'Identifier', column: false, name: 'a', location: [0, 1] },
            location: [2, 3]
        },

        'x.y ?': {
            type: 'UnaryExpression',
            operator: '?',
            argument: {
                type: 'MemberExpression',
                object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
                property: { type: 'String', value: 'y', location: [2, 3] },
                location: [0, 3]
            },
            location: [4, 5]
        },

        '(x?)[1] ?': {
            type: 'UnaryExpression',
            operator: '?',
            argument: {
                type: 'MemberExpression',
                object: {
                    type: 'UnaryExpression',
                    operator: '?',
                    argument: {
                        column: false,
                        location: [1, 2],
                        name: 'x',
                        type: 'Identifier'
                    },
                    location: [2, 3]
                },
                property: { type: 'Number', value: 1, location: [5, 6] },
                location: [2, 7]
            },
            location: [8, 9]
        },

        'x.y? ?? null': {
            type: 'BinaryExpression',
            operator: '??',
            left: {
                type: 'UnaryExpression',
                operator: '?',
                argument: {
                    type: 'MemberExpression',
                    object: {
                        type: 'Identifier',
                        column: false,
                        name: 'x',
                        location: [0, 1]
                    },
                    property: {
                        type: 'String',
                        value: 'y',
                        location: [2, 3]
                    },
                    location: [0, 3]
                },
                location: [3, 4]
            },
            right: {
                type: 'Null',
                location: [8, 12]
            },
            location: [5, 7]
        },
    }));

    describe('Вызовы функций', factory({
        'sum()': {
            type: 'CallExpression',
            arguments: [],
            callee: 'sum',
            location: [0, 3]
        },

        'sum(1, 2)': {
            type: 'CallExpression',
            arguments: [
                { type: 'Number', value: 1, location: [4, 5] },
                { type: 'Number', value: 2, location: [7, 8] }
            ],
            callee: 'sum',
            location: [0, 3]
        },

        'sum(1, , 2)': new Error('parse2 :: ,'),
        'sum(1, 2, )': new Error('parse2 :: )'),
        'sum(1 2)': new Error('parse5 :: ,'),

        'sum(1, mod(2, 3))': {
            type: 'CallExpression',
            arguments: [
                { type: 'Number', value: 1, location: [4, 5] },
                {
                    type: 'CallExpression',
                    arguments: [
                        { type: 'Number', value: 2, location: [11, 12] },
                        { type: 'Number', value: 3, location: [14, 15] }
                    ],
                    callee: 'mod',
                    location: [7, 10]
                }
            ],
            callee: 'sum',
            location: [0, 3]
        },

        'sum(]': new Error('parse5 :: ,'),
        'sum(123]': new Error('parse5 :: ,'),
        'sum(,1)': new Error('parse2 :: ,'),
        'unknown()': new Error('parse14 :: unknown'),
    }));

    describe('Доступ к свойствам', factory({
        'x.y': {
            type: 'MemberExpression',
            object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
            property: { type: 'String', value: 'y', location: [2, 3] },
            location: [0, 3]
        },

        'x . y': {
            type: 'MemberExpression',
            object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
            property: { type: 'String', value: 'y', location: [4, 5] },
            location: [0, 5]
        },

        'x["y"]': {
            type: 'MemberExpression',
            object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
            property: { type: 'String', value: 'y', location: [2, 5] },
            location: [0, 6]
        },

        'x[1]': {
            type: 'MemberExpression',
            object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
            property: { type: 'Number', value: 1, location: [2, 3] },
            location: [0, 4]
        },

        'x[[1]]': {
            type: 'MemberExpression',
            object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
            property: {
                type: 'ArrayExpression',
                elements: [{ type: 'Number', value: 1, location: [3, 4] }],
                location: [2, 5]
            },
            location: [0, 6]
        },

        'x [ [ 1 ] ]': {
            type: 'MemberExpression',
            object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
            property: {
                type: 'ArrayExpression',
                elements: [{ type: 'Number', value: 1, location: [6, 7] }],
                location: [4, 9]
            },
            location: [0, 11]
        },

        'x[y]': {
            type: 'MemberExpression',
            object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
            property: { type: 'Identifier', column: false, name: 'y', location: [2, 3] },
            location: [0, 4]
        },

        'x.y.z': {
            type: 'MemberExpression',
            object: {
                type: 'MemberExpression',
                object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
                property: { type: 'String', value: 'y', location: [2, 3] },
                location: [0, 3]
            },
            property: { type: 'String', value: 'z', location: [4, 5] },
            location: [0, 5]
        },

        'x.y[z]': {
            type: 'MemberExpression',
            object: {
                type: 'MemberExpression',
                object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
                property: { type: 'String', value: 'y', location: [2, 3] },
                location: [0, 3]
            },
            property: { type: 'Identifier', column: false, name: 'z', location: [4, 5] },
            location: [0, 6]
        },

        "x['y'].z": {
            type: 'MemberExpression',
            object: {
                type: 'MemberExpression',
                object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
                property: { type: 'String', value: 'y', location: [2, 5] },
                location: [0, 6]
            },
            property: { type: 'String', value: 'z', location: [7, 8] },
            location: [0, 8]
        },

        "x['ю'].z": {
            type: 'MemberExpression',
            object: {
                type: 'MemberExpression',
                object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
                property: { type: 'String', value: 'ю', location: [2, 5] },
                location: [0, 6]
            },
            property: { type: 'String', value: 'z', location: [7, 8] },
            location: [0, 8]
        },

        'x.y[z + 2]': {
            type: 'MemberExpression',
            object: {
                type: 'MemberExpression',
                object: { type: 'Identifier', column: false, name: 'x', location: [0, 1] },
                property: { type: 'String', value: 'y', location: [2, 3] },
                location: [0, 3]
            },
            property: {
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'Identifier', column: false, name: 'z', location: [4, 5] },
                right: { type: 'Number', value: 2, location: [8, 9] },
                location: [6, 7]
            },
            location: [0, 10]
        },

        'sum(1, 2).test': {
            type: 'MemberExpression',
            object: {
                type: 'CallExpression',
                arguments: [
                    { type: 'Number', value: 1, location: [4, 5] },
                    { type: 'Number', value: 2, location: [7, 8] }
                ],
                callee: 'sum',
                location: [0, 3]
            },
            property: { type: 'String', value: 'test', location: [10, 14] },
            location: [0, 14]
        },
    }));

    describe('Тернарный оператор', factory({
        'a ? b : c': new Error('parse2 :: b'),
    }));

    describe('Объекты', factory({
        '{}': {
            type: 'ObjectExpression',
            properties: [],
            location: [0, 2]
        },

        '{,}': new Error('parse9 :: }'),

        '{x: 1}': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x',
                location: [1, 2],
                value: { type: 'Number', value: 1, location: [4, 5] },
            }],
            location: [0, 6]
        },

        '{x: 1, }': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x',
                location: [1, 2],
                value: { type: 'Number', value: 1, location: [4, 5] },
            }],
            location: [0, 8]
        },

        '{x}': new Error('parse12'),

        '{x: x}': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x',
                location: [1, 2],
                value: { type: 'Identifier', column: false, name: 'x', location: [4, 5] },
            }],
            location: [0, 6]
        },

        '{2: x}': new Error('parse10'),
        '{[123]: x}': new Error('parse10'),

        '{"2": x}': {
            type: 'ObjectExpression',
            properties: [{
                key: '2',
                location: [1, 4],
                value: { type: 'Identifier', column: false, name: 'x', location: [6, 7] },
            }],
            location: [0, 8]
        },

        '{null: x}': {
            type: 'ObjectExpression',
            properties: [{
                key: 'null',
                location: [1, 5],
                value: { type: 'Identifier', column: false, name: 'x', location: [7, 8] },
            }],
            location: [0, 9]
        },

        '{"\\x": x}': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x',
                location: [1, 5],
                value: { type: 'Identifier', column: false, name: 'x', location: [7, 8] },
            }],
            location: [0, 9]
        },

        '{ "\\x" : x }': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x',
                location: [2, 6],
                value: { type: 'Identifier', column: false, name: 'x', location: [9, 10] },
            }],
            location: [0, 12]
        },

        '{x: 1}.x': {
            type: 'MemberExpression',
            object: {
                type: 'ObjectExpression',
                properties: [{
                    key: 'x',
                    location: [1, 2],
                    value: { type: 'Number', value: 1, location: [4, 5] },
                }],
                location: [0, 6]
            },
            property: { type: 'String', value: 'x', location: [7, 8] },
            location: [0, 8]
        },

        "{x: 1}['x']": {
            type: 'MemberExpression',
            object: {
                type: 'ObjectExpression',
                properties: [{
                    key: 'x',
                    location: [1, 2],
                    value: { type: 'Number', value: 1, location: [4, 5] },
                }],
                location: [0, 6]
            },
            property: { type: 'String', value: 'x', location: [7, 10] },
            location: [0, 11]
        },

        '{x: 1, y: 2}': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x',
                location: [1, 2],
                value: { type: 'Number', value: 1, location: [4, 5] },
            }, {
                key: 'y',
                location: [7, 8],
                value: { type: 'Number', value: 2, location: [10, 11] },
            }],
            location: [0, 12]
        },

        '{x: 1 y: 2}': new Error('parse9 :: ,'),
        '{x: 1, , y: 2}': new Error('parse9 :: }'),

        '{x: 1, z: z, y: 2}': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x',
                location: [1, 2],
                value: { type: 'Number', value: 1, location: [4, 5] },
            }, {
                key: 'z',
                location: [7, 8],
                value: { type: 'Identifier', column: false, name: 'z', location: [10, 11] },
            }, {
                key: 'y',
                location: [13, 14],
                value: { type: 'Number', value: 2, location: [16, 17] },
            }],
            location: [0, 18]
        },

        '{x1: 1, "z 3": "43"}': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x1',
                location: [1, 3],
                value: { type: 'Number', value: 1, location: [5, 6] },
            }, {
                key: 'z 3',
                location: [8, 13],
                value: { type: 'String', value: "43", location: [15, 19] },
            }],
            location: [0, 20]
        },

        '{x1: 1, "zй3": "43"}': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x1',
                location: [1, 3],
                value: { type: 'Number', value: 1, location: [5, 6] },
            }, {
                key: 'zй3',
                location: [8, 13],
                value: { type: 'String', value: "43", location: [15, 19] },
            }],
            location: [0, 20]
        },

        '{x1: 1, "z 3": {x: {y: y}}}': {
            type: 'ObjectExpression',
            properties: [{
                key: 'x1',
                location: [1, 3],
                value: { type: 'Number', value: 1, location: [5, 6] },
            }, {
                key: 'z 3',
                location: [8, 13],
                value: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: 'x',
                        location: [16, 17],
                        value: {
                            type: 'ObjectExpression',
                            properties: [{
                                key: 'y',
                                location: [20, 21],
                                value: { type: 'Identifier', column: false, name: 'y', location: [23, 24] },
                            }],
                            location: [19, 25]
                        },
                    }],
                    location: [15, 26]
                },
            }],
            location: [0, 27]
        },
    }));

    describe('Лишние символы', factory({
        '| x': new Error('parse2 :: |'),
        'x |': new Error('parse2 :: |'),
    }));

    describe('Синтаксический сахар для let', factory({
        '1;2': new Error('parse18'),
        '1 2': new Error('parse2 :: 2'),
        'a = 1 b = 2': new Error('parse2 :: b'),

        'a = 1; b = 2': {
            arguments: [{
                type: "ObjectExpression",
                properties: [{
                    key: "a",
                    location: [0, 1],
                    value: { location: [4, 5], type: "Number", value: 1 }
                }],
                location: [0, 0],
            }, {
                left: { column: false, location: [7, 8], name: "b", type: "Identifier", },
                location: [9, 10],
                operator: "=",
                right: { location: [11, 12], type: "Number", value: 2 },
                type: "BinaryExpression",
            }],
            callee: "let",
            location: [0, 0],
            type: "CallExpression",
        },

        'a = 1; b = 2;': {
            arguments: [{
                type: "ObjectExpression",
                properties: [{
                    key: "a",
                    location: [0, 1],
                    value: { location: [4, 5], type: "Number", value: 1 }
                }],
                location: [0, 0],
            }, {
                left: { column: false, location: [7, 8], name: "b", type: "Identifier", },
                location: [9, 10],
                operator: "=",
                right: { location: [11, 12], type: "Number", value: 2 },
                type: "BinaryExpression",
            }],
            callee: "let",
            location: [0, 0],
            type: "CallExpression",
        },

        'a = 1;  b = 2;': {
            arguments: [{
                type: "ObjectExpression",
                properties: [{
                    key: "a",
                    location: [0, 1],
                    value: { location: [4, 5], type: "Number", value: 1 }
                }],
                location: [0, 0],
            }, {
                left: { column: false, location: [8, 9], name: "b", type: "Identifier", },
                location: [10, 11],
                operator: "=",
                right: { location: [12, 13], type: "Number", value: 2 },
                type: "BinaryExpression",
            }],
            callee: "let",
            location: [0, 0],
            type: "CallExpression",
        },

        'a = 1;; b = 2;;': {
            arguments: [{
                type: "ObjectExpression",
                properties: [{
                    key: "a",
                    location: [0, 1],
                    value: { location: [4, 5], type: "Number", value: 1 }
                }],
                location: [0, 0],
            }, {
                left: { column: false, location: [8, 9], name: "b", type: "Identifier", },
                location: [10, 11],
                operator: "=",
                right: { location: [12, 13], type: "Number", value: 2 },
                type: "BinaryExpression",
            }],
            callee: "let",
            location: [0, 0],
            type: "CallExpression",
        },

        ';a = 1;  b = 2': {
            arguments: [{
                type: "ObjectExpression",
                properties: [{
                    key: "a",
                    location: [1, 2],
                    value: { location: [5, 6], type: "Number", value: 1 }
                }],
                location: [0, 0],
            }, {
                left: { column: false, location: [9, 10], name: "b", type: "Identifier", },
                location: [11, 12],
                operator: "=",
                right: { location: [13, 14], type: "Number", value: 2 },
                type: "BinaryExpression",
            }],
            callee: "let",
            location: [0, 0],
            type: "CallExpression",
        },

        ' a = 1;; b = 2;;': {
            arguments: [{
                type: "ObjectExpression",
                properties: [{
                    key: "a",
                    location: [1, 2],
                    value: { location: [5, 6], type: "Number", value: 1 }
                }],
                location: [0, 0],
            }, {
                left: { column: false, location: [9, 10], name: "b", type: "Identifier", },
                location: [11, 12],
                operator: "=",
                right: { location: [13, 14], type: "Number", value: 2 },
                type: "BinaryExpression",
            }],
            callee: "let",
            location: [0, 0],
            type: "CallExpression",
        },
    }));
});