const should = require('should/as-function');

const { parseExpression, Expression} = require("../dist/editor.cjs");

const utils = require('./utils.js');
const config = require("./config");
const php_evaluate = require('./php.evaluate');

function factory(group) {
    return function () {
        for (const code in group) {
            const ast = parseExpression(code);
            const expectation = group[code];

            let result;
            before(async function() {
                this.timeout(config.test_timeout);
                result = await php_evaluate('evaluatePath', ast, utils.scope);
            });

            specify(code, async () => {
                console.log(result);

                if (expectation instanceof Error) {
                    should(result.result).be.a.null();
                    should(result.error).not.be.a.null();
                    should(result.error).deepEqual(
                        expectation.message,
                        `Different error from ${JSON.stringify(result)}`
                    );

                    should(Expression.ErrorTranslator.hasTranslationFor(result.error)).be.true(
                        'Missing translation for ' + result.error
                    );
                } else {
                    should(result.error).be.a.null();
                    should(result.result).deepEqual(
                        expectation,
                        `Different result from ${JSON.stringify(result)}`
                    );
                }
            });
        }
    }
}

describe('evaluatePath', () => {
    describe('Статический путь', factory({
        '': [],
        'a': ['a'],
        'abc': ['abc'],
        'a.b.c': ['a', 'b', 'c'],
        'a.b[1].c': ['a', 'b', 1, 'c'],
        'a.b[1].c["test"]': ['a', 'b', 1, 'c', 'test'],
    }));

    describe('Динамический путь', factory({
        'a[2 + 2]': ['a', 4],
        'abc["hello"]["worl" & "d"]': ['abc', 'hello', 'world'],
        'a.b[1 - 100].c["test"]': ['a', 'b', -99, 'c', 'test'],
        'a[3 - number1][substr(string1, 1, 1)]["te" & "st"]': ['a', 2, 'b', 'test'],
    }));

    describe('Ошибки', factory({
        '12': new Error('evaluate :: pathTypeError'),
        '"abc"': new Error('evaluate :: pathTypeError'),
        'true': new Error('evaluate :: pathTypeError'),
        'null': new Error('evaluate :: pathTypeError'),
        '2 + 2': new Error('evaluate :: pathTypeError'),
        '(2 + 2)[1]': new Error('evaluate :: pathTypeError'),
        '(x?)[1]': new Error('evaluate :: pathTypeError'),

        'a[2 + true]': new Error('evaluate :: add1 :: boolean'),
        'a[max("asd")]': new Error('evaluate :: fn1 :: max,string'),
    }));
});