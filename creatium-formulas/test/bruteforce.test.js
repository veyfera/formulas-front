const should = require('should/as-function');
should.config = { plusZeroAndMinusZeroEqual: false };

const { Expression } = require('../javascript/Expression.js');

const mongo_evaluate = require('./mongo.evaluate');
const php_evaluate = require('./php.evaluate');
const node_evaluate = ast => new Expression(ast).evaluate({});

const utils = require('./utils');

const random_values = [
    Infinity,
    -Infinity,
    0,
    -0.1,
    0.1,
    -0.5,
    0.5,
    -1,
    1,
    -1.5,
    1.5,
    -2,
    2,
    -3,
    3,
    45,
    Math.PI,
    12345678912345678912345678912123456789,
    -12345678912345678912345678912123456789,
    Number.MAX_VALUE,
    Number.MIN_VALUE,
    2147483647, // 32 int max
    -2147483647,
    9223372036854775807, // 64 int max
    -9223372036854775807,
    9223372036854776000,
    -9223372036854776000,

    '',
    '1',
    'true',
    'false',
    'null',
    '-1',
    '+',
    '-',
    '$unknown',
    'inf',
    '-inf',
    'Infinity',
    '-Infinity',
    'NaN',

    true,
    false,

    null,
    NaN,

    [],
    [1, 3, 2],
    {},
    {x: 3, z: 1, y: 2},
    ["a", 1],
    [["a", 1], ["b", 2]],

    Date.now(),
    new Date(0),
    new Date(-1000),
    new Date(1000),
];

const scope = {};

random_values.forEach((value, index) => {
    utils.scope[`var${index}`] = value;
});

utils.random_variable = function () {
    const index = Math.floor(Math.random() * (utils.values.length));
    const value = utils.values[index];

    // Случайным образом
    if (Math.random() > 0.5) {
        return { type: 'Identifier', name: `var${index}` };
    } else {
        return utils.value2ast(value);
    }
}

const generators = [
    {
        name: 'MemberExpression',
        variables: 2,
        fabric: (vars) => {
            return {
                type: 'MemberExpression',
                object: vars[0],
                property: vars[1],
            };
        },
    },
    ...utils.unary_operators.map(operator => {
        return {
            name: 'UnaryExpression:' + operator,
            variables: 1,
            fabric: (vars) => {
                return {
                    type: 'UnaryExpression',
                    argument: vars[0],
                    operator,
                };
            },
        };
    }),
    // ...utils.binary_operators.map(operator => {
    //     return {
    //         name: 'BinaryExpression:' + operator,
    //         variables: 2,
    //         fabric: (vars) => {
    //             return {
    //                 type: 'BinaryExpression',
    //                 left: vars[0],
    //                 right: vars[0],
    //                 operator,
    //             };
    //         },
    //     };
    // }),
    // ...utils.functions.map(fn => {
    //     return {
    //         name: 'CallExpression:' + fn.callee,
    //         variables: fn.args,
    //         fabric: (vars) => {
    //             return {
    //                 type: 'CallExpression',
    //                 arguments: vars,
    //                 callee: fn.callee,
    //             };
    //         },
    //     };
    // }),
];

const combinations = [[...utils.values.map(value => [value])], [], [], []];
for (let i = 1; i < combinations.length; i++) {
    for (const combination of combinations[i - 1]) {
        for (const value of utils.values) {
            const next = [...combination, value];
            combinations[i].push(next);
        }
    }
}

suite('bruteforce evaluate', () => {
    for (const generator of generators) {
        suite(generator.name + ' ' + generator.variables, async () => {
            for (const combination of combinations[generator.variables - 1]) {
                suite(generator.name + ' ' + JSON.stringify(combination), async () => {
                    const ast = generator.fabric(combination);

                    let mongo_result, php_result, node_result;
                    suiteSetup(async function() {
                        mongo_result = await mongo_evaluate(ast, {});
                        php_result = await php_evaluate(ast, {});
                        node_result = node_evaluate(ast);
                    });

                    test('php', () => {
                        if (mongo_result.error) {
                            if (php_result.result !== null) console.log(mongo_result.error);
                            should(php_result.result).be.a.null();
                        } else {
                            should(node_result.error).be.a.null();
                            should(php_result).deepEqual(mongo_result);
                        }
                    });

                    test('node', async () => {
                        if (mongo_result.error) {
                            if (node_result.result !== null) console.log(mongo_result.error);
                            should(node_result.result).be.a.null();
                        } else {
                            should(node_result.error).be.a.null();
                            should(node_result).deepEqual(mongo_result);
                        }
                    });
                });
            }
        });
    }
});