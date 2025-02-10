const should = require('should/as-function');
should.config = { plusZeroAndMinusZeroEqual: false };

const mongo_evaluate = require('./mongo.evaluate');
const php_evaluate = require('./php.evaluate');
const node_evaluate = require('./node.evaluate');

const { parseExpression } = require("../dist/parser.cjs");

const utils = require('./utils');

const ast = {
    "type": "ConditionalExpression",
    "test": {
        "type": "CallExpression",
        "arguments": [
            {
                "type": "Number",
                "value": -3
            },
            {
                "type": "BinaryExpression",
                "left": {
                    "type": "Number",
                    "value": null
                },
                "right": {
                    "type": "Number",
                    "value": 2147483647
                },
                "operator": "%"
            }
        ],
        "callee": "_less"
    },
    "consequent": {
        "type": "Identifier",
        "name": "var24"
    },
    "alternate": {
        "type": "Identifier",
        "name": "var20"
    }
} && parser('sum(map(array1, item + number2))');

describe('manual', () => {
    const results = { mongo: null, php: null, node: null };
    before(async function() {
        results.mongo = await mongo_evaluate(ast, utils.scope);
        results.php = await php_evaluate(ast, utils.scope);
        results.node = node_evaluate(ast, utils.scope);

        console.log(results);
    });

    for (const target of ['mongo', 'php', 'node']) {
        specify(target, async () => {
            console.log(results[target]);

            if (results.mongo.error) {
                should(results[target].result).be.a.null();
                should(results[target].error).not.be.a.null();
                should(results[target].error).deepEqual(
                    results.mongo.error,
                    `Different error from ${JSON.stringify(results[target])}`
                );
            } else {
                should(results[target].error).be.a.null();
                should(results[target].result).deepEqual(
                    results.mongo.result,
                    `Different result from ${JSON.stringify(results[target])}`
                );
            }
        });
    }
});