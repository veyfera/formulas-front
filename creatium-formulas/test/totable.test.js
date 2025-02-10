const { execSync } = require('child_process');
const should = require('should/as-function');

const { Expression, parseExpression } = require("../dist/editor.cjs");

const php_evaluate = require('./php.evaluate');
const node_evaluate = require('./node.evaluate');

const config = require('./config');
const utils = require("./utils");

function factory(group) {
    return function () {
        for (const code in group) {
            const ast = parseExpression(code);
            const expectation = group[code];

            const results = { php: null, node: null };
            before(async function() {
                this.timeout(config.test_timeout);
                results.php = await php_evaluate('evaluateToTable', ast, utils.scope);
                results.node = node_evaluate('evaluateToTable', ast, utils.scope);
            });

            for (const target of ['php', 'node']) {
                specify(code + ', ' + target, async () => {
                    console.log(results[target]);

                    if (expectation instanceof Error) {
                        should(results[target].result).be.a.null();
                        should(results[target].error).not.be.a.null();

                        if (expectation.message.indexOf(' || ') > 0) {
                            should(results[target].error).equalOneOf(
                                expectation.message.split(' || ')
                            );
                        } else {
                            should(results[target].error).deepEqual(
                                expectation.message,
                                `Different error from ${JSON.stringify(results[target])}`
                            );
                        }

                        should(Expression.ErrorTranslator.hasTranslationFor(results[target].error)).be.true(
                            'Missing translation for ' + results[target].error
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

describe('toTable', () => {
    describe('Пустая таблица', factory({
        '': {
            'columns': [],
            'rows': [],
            'total_count': 0,
        },
        '[]': {
            'columns': [],
            'rows': [],
            'total_count': 0,
        },
        'null': {
            'columns': [],
            'rows': [],
            'total_count': 0,
        },
    }));

    describe('Примитивные типы', factory({
        '0': new Error('finalize :: toTable1 :: number'),
        '"1"': new Error('finalize :: toTable1 :: string'),
        'true': new Error('finalize :: toTable1 :: boolean'),
        '{}': new Error('finalize :: toTable1 :: object'),
        'now()': new Error('finalize :: toTable1 :: date'),
    }));

    describe('Массив не тех элементов', factory({
        '[0]': new Error('finalize :: toTable2 :: number'),
        '["1"]': new Error('finalize :: toTable2 :: string'),
        '[true]': new Error('finalize :: toTable2 :: boolean'),
        '[[]]': new Error('finalize :: toTable2 :: array'),
        '[now()]': new Error('finalize :: toTable2 :: date'),
        '[null]': new Error('finalize :: toTable2 :: null'),

        '[{}, 0]': new Error('finalize :: toTable2 :: number'),
        '[{}, "1"]': new Error('finalize :: toTable2 :: string'),
        '[{}, true]': new Error('finalize :: toTable2 :: boolean'),
        '[{}, []]': new Error('finalize :: toTable2 :: array'),
        '[{}, now()]': new Error('finalize :: toTable2 :: date'),
        '[{}, null]': new Error('finalize :: toTable2 :: null'),
    }));

    describe('Пустые строки', factory({
        '[{}]': {
            'columns': [],
            'rows': [{}],
            'total_count': 1,
        },
        '[{}, { x: 1 }]': {
            'columns': [],
            'rows': [{}, {}],
            'total_count': 2,
        },
        '[{ x: 1 }, {}]': {
            'columns': [{ 'id': 'x', 'name': 'x', 'type': 'any' }],
            'rows': [{ x: 1 }, { x: null }],
            'total_count': 2,
        },
        '[{ x: 1 }, {}, { y: 1 }]': {
            'columns': [{ 'id': 'x', 'name': 'x', 'type': 'any' }],
            'rows': [{ x: 1 }, { x: null }, { x: null }],
            'total_count': 3,
        },
    }));

    describe('Рабочий пример', factory({
        '[{ x: 1, y: "abc" }, { x: false, y: [1, 3] }]': {
            'columns': [
                { 'id': 'x', 'name': 'x', 'type': 'any' },
                { 'id': 'y', 'name': 'y', 'type': 'any' }
            ],
            'rows': [{ x: 1, y: "abc" }, { x: false, y: [1, 3] }],
            'total_count': 2,
        },
    }));
});