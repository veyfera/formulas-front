const should = require('should/as-function');

const { Expression, parseExpression } = require("../dist/editor.cjs");

const php_evaluate = require('./php.evaluate');
const node_evaluate = require('./node.evaluate');

const utils = require('./utils.js');
const config = require("./config");

function factory(group) {
    return function () {
        for (const [code, expectation] of group) {
            const ast = parseExpression(code);

            const results = { php: null, node: null };
            before(async function() {
                this.timeout(config.test_timeout);
                results.php = await php_evaluate('preEvaluate', ast, utils.scope);
                results.node = node_evaluate('preEvaluate', ast, utils.scope);
            });

            for (const target of ['php', 'node']) {
                specify(code + ', ' + target, async () => {
                    console.log(results[target]);

                    if (expectation instanceof Error) {
                        should(results[target].result).be.a.null();
                        should(results[target].error).not.be.a.null();

                        should(results[target].error).deepEqual(
                            expectation.message,
                            `Different error from ${JSON.stringify(results[target])}`
                        );

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

describe('preEvaluate', () => {
    describe('Без колонок и переменных', factory([
        [`2 + 2`, `4`],
        [`2 + 2 * 2`, `6`],
        [`'abc' & 'def'`, `"abcdef"`],
        [`count([1, 2, 3])`, `3`],
        [`{x: 1, y: 2}.y * 4`, `8`],
    ]));

    describe('С переменными', factory([
        [`2 + number2`, `4`],
        [`2 + 2 * number2`, `6`],
        [`number2 + 2 * 2`, `6`],
        [`'abc' & number2`, `"abc2"`],
        [`'abc' & 'def' & number2`, `"abcdef2"`],
        [`count([1, number2, 3])`, `3`],
        [`count([1, number2, 3 + 4])`, `3`],
        [`count([1, number2 - 1, 3 + 4])`, `3`],
        [`sum([1, number2 - 1, 3 + 4])`, `9`],
        [`{x: number2, y: 2}.y * 4 * 4`, `32`],
        [`{x: number2, y: 2}.y * (4 * 4)`, `32`],
        [`4 * 4 * {x: number2, y: 2}.y`, `32`],
        [`exists(object1)`, `true`],
        [`exists(object1.a)`, `true`],
        [`exists(array1)`, `true`],
        [`exists(array1[2 - 1])`, `true`],
        [`exists(null1)`, `true`],
        [`exists(null)`, `true`],
    ]));

    describe('С несуществующими переменными', factory([
        [`unknown`, new Error('preeval :: var1 :: unknown')],
        [`unknown - 2`, new Error('preeval :: var1 :: unknown')],
        [`map(array1, value)`, new Error('preeval :: var1 :: value')],
        [`let({ x: y }, x)`, new Error('preeval :: var1 :: y')],
        [`let({ x: x }, 123)`, new Error('preeval :: var1 :: x')],
        [`let({ x: y, y: 123 }, y)`, new Error('preeval :: var1 :: y')],
        [`exists(object1.unknown)`, `false`],
        [`exists(object1.a.unknown)`, `false`],
        [`exists(array1[55])`, `false`],
        [`exists(array1[1].unknown)`, `false`],
        [`exists(unknown)`, `false`],
        [`exists(unknown2)`, `false`],
        [`exists(unknown.b)`, `false`],
    ]));

    describe('С колонками', factory([
        [`2 + @x`, `sum([2, @x])`],
        [`2 + 2 * @x`, `sum([2, multiply([2, @x])])`],
        [`@x + 2 * 2`, `sum([@x, 4])`],
        [`'abc' & @x`, `join(["abc", @x])`],
        [`'abc' & 'def' & @x`, `join(["abcdef", @x])`],
        [`count([1, @x, 3])`, `count([1, @x, 3])`],
        [`count([1, @x, 3 + 4])`, `count([1, @x, 7])`],
        [`count([1, @x - 1, 3 + 4])`, `count([1, (@x - 1), 7])`],
        [`sum([1, @x - 1, 3 + 4])`, `sum([1, (@x - 1), 7])`],
        [`{x: @x, y: 2}.y * 4 * 4`, `multiply([multiply([{"x": @x, "y": 2}["y"], 4]), 4])`],
        [`{x: @x, y: 2}.y * (4 * 4)`, `multiply([{"x": @x, "y": 2}["y"], 16])`],
        [`4 * 4 * {x: @x, y: 2}.y`, `multiply([16, {"x": @x, "y": 2}["y"]])`],
    ]));

    describe('С переменными и колонками', factory([
        [`2 + @x * number2`, `sum([2, multiply([@x, 2])])`],
        [`2 + number2 * @x`, `sum([2, multiply([2, @x])])`],
        [`@x + 2 * number2`, `sum([@x, 4])`],
        [`'abc' & @x & string2`, `join([join(["abc", @x]), "def"])`],
        [`'abc' & string2 & @x`, `join(["abcdef", @x])`],
        [`count([1, @x, 3 - number2])`, `count([1, @x, 1])`],
        [`count([1, @x, 3 + number4])`, `count([1, @x, 7])`],
        [`count([1, @x - 1 * number2, 3 + number4])`, `count([1, (@x - 2), 7])`],
        [`sum([1, @x - 1, number3 + 4])`, `sum([1, (@x - 1), 7])`],
        [`{x: @x, y: number2}.y * 4 * number4`, `multiply([multiply([{"x": @x, "y": 2}["y"], 4]), 4])`],
        [`{x: @x, y: number2}.y * (number4 * 4)`, `multiply([{"x": @x, "y": 2}["y"], 16])`],
        [`4 * number4 * {x: @x, y: number2}.y`, `multiply([16, {"x": @x, "y": 2}["y"]])`],
    ]));

    describe('С локальными переменными', factory([
        [`sum(map(array1, item + number2))`, `12`],
        [`sum(map(array1, item + number2)) + number2`, `14`],
        [`sum(map(array1, item + number2)) + @x`, `sum([12, @x])`],
        [`sum(map(array1, item + number2) + @x)`, `sum(sum([[3, 4, 5], @x]))`],
        [`sum(map(array1, item + @x))`, `sum(map([1, 2, 3], sum([item, @x])))`],

        [`sum(filter(array1, item >= number2)) + @x`, `sum([5, @x])`],
        [`sum(filter(array1, item >= number2) + @x)`, `sum(sum([[2, 3], @x]))`],

        [`reduce(array1, value + item + number2, 0)`, `12`],
        [`reduce(array1, value + item + number2, 0) + @x`, `sum([12, @x])`],
        [`reduce(array1, value + item + number2 + 4, @x)`, `reduce([1, 2, 3], sum([sum([sum([value, item]), 2]), 4]), @x)`],
        [`reduce(array1, value + item + (number2 + 4), @x)`, `reduce([1, 2, 3], sum([sum([value, item]), 6]), @x)`],

        [`sort(array1, item)`, `[1, 2, 3]`],
        [`sort(array1, -item) + @x`, `sum([[3, 2, 1], @x])`],

        [`filter([], let({ item2: item }, true))`, `[]`],
    ]));

    describe('С функцией let', factory([
        [`let({ x: 123 }, x)`, `123`],
        [`let({ x: 123, y: x * number2 }, y)`, `246`],
        [`let({ x: 123, y: x * number2 }, x + y)`, `369`],

        [`let({
            x: 123, y: x * number2, z: @x
        }, x + y)`, `let({"x": 123, "y": 246, "z": @x}, 369)`],

        [`let({
            x: 10, y: @x, z: x * 5
        }, z)`, `let({"x": 10, "y": @x, "z": 50}, 50)`],

        [`let({
            x: 10, y: @x, z: x * 5
        }, x * z + y)`, `let({"x": 10, "y": @x, "z": 50}, sum([500, y]))`],

        [`[].filter(let({ item2: item },
            item == item2
        ))`, `[]`],
    ]));

    describe('Унарные операторы', factory([
        [`obj = {}; obj[@number1]?`, `let({"obj": {}}, ({}[@number1] ?? null))`],
        [`+@number1`, `sum([0, @number1])`],
        [`-@number1`, `(0 - @number1)`],
    ]));
});