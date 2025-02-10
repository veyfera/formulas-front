const fs = require('fs');
const crypto = require('crypto');

const { Expression } = require("../dist/editor");

const mongo_evaluate = require('./mongo.evaluate');
const php_evaluate = require('./php.evaluate');
const node_evaluate = (ast, scope) => {
    try {
        return new Expression(ast).evaluate(scope);
    } catch (e) {
        return {
            error: e.message,
            result: null,
        };
    }
};

const utils = require('./utils');

const generators = [
    function CallExpression() {
        return {
            type: 'CallExpression',
            arguments: utils.random_array(0, 4).map(i => generate()),
            callee: utils.sample([...new Set(utils.functions.map(fn => fn.callee))]),
        };
    },
    function BinaryExpression() {
        return {
            type: 'BinaryExpression',
            left: generate(),
            right: generate(),
            operator: utils.sample(utils.binary_operators),
        };
    },
    function UnaryExpression() {
        return {
            type: 'UnaryExpression',
            argument: generate(),
            operator: utils.sample(utils.unary_operators),
        };
    },
    function MemberExpression() {
        return {
            type: 'MemberExpression',
            object: generate(),
            property: generate(),
        };
    },
    function ObjectExpression() {
        return {
            type: 'ObjectExpression',
            properties: utils.random_array(0, 5).map(i => {
                return {
                    key: i.toString(),
                    value: generate(), // Совместить с MemberExpression таки
                }
            }),
        };
    },
    function ArrayExpression() {
        return {
            type: 'ArrayExpression',
            elements: utils.random_array(0, 5).map(i => generate()), // Совместить с MemberExpression таки
        };
    },
];

function generate(root = false) {
    if (root || Math.random() >= 0.8) {
        return utils.sample(generators)();
    } else {
        return utils.random_variable();
    }
}

function compare(ast, platform, output, expect) {
    if (expect.error) {
        if (output.error !== null && output.error === expect.error) {
            return;
        } else {
            console.log(expect);
            console.log(output);
            console.error(`${platform}: Result and expect are different`);
        }
    } else {
        if (utils.equal(output.result, expect.result)) {
            return;
        } else {
            console.log(expect);
            console.log(output);
            console.error(`${platform}: Result and expect are different`);
        }
    }

    const hash = crypto.createHash('md5').update(JSON.stringify(ast)).digest("hex");

    console.log(`node test/random.test.js ${hash}.json`);

    const file = `test/random-reports/${hash}.json`;
    fs.writeFileSync(
        file,
        Expression.encodeDataToJSON({ ast, output, expect }, null, 2)
    );

    return `${hash}.json`;
}

async function evaluate(ast) {
    const scope = utils.scope;

    const mongo_output = await mongo_evaluate(ast, scope);

    const php_output = await php_evaluate(ast, scope);
    compare(ast, 'php', php_output, mongo_output);

    const node_output = node_evaluate(ast, scope);
    compare(ast, 'node', node_output, mongo_output);

    return !!mongo_output.error;
}

async function run() {
    const reports = fs.readdirSync('./test/random-reports');

    if (reports.length) {
        for (const report of reports) {
            if (process.argv[2] && report !== process.argv[2]) continue;

            const file = './test/random-reports/' + report;
            const json = Expression.decodeDataFromJSON(fs.readFileSync(file, { encoding: 'utf8' }));
            fs.unlinkSync(file);
            await evaluate(json.ast);
            console.log('report ' + report);
        }

        process.exit();
    } else {
        for (let n = 0; n < 1_000_000_000; n++) {
            const result_type = await evaluate(generate(true));
            console.log('random ' + n + ' ' + (result_type ? 'result' : 'error'));
        }
    }
}

console.log(utils.scope);

run();