const { execSync } = require('child_process');
const { MongoClient } = require('mongodb');

const config = require('./config');

const php_evaluate = require('./php.evaluate');

const client = new MongoClient(config.mongo_uri);
let collection;

function connect() {
    return new Promise(function (resolve, reject) {
        client.connect(err => {
            if (err) reject(err);
            collection = client.db(config.mongo_database).collection(config.mongo_collection);
            collection.deleteMany({}).then(resolve);
        });
    });
}

module.exports = async function (ast, scope) {
    const output = await php_evaluate('toMongoExpression', ast, scope, true);
    if (output.error) return output;

    if (!collection) await connect();

    const _test_id = Math.random();
    await collection.insertOne({ ...scope, _test_id });

    try {
        const started = Date.now();

        const result = await collection.aggregate([{
            '$match': {
                _test_id,
            }
        }, {
            "$addFields": {
                _expression_result: output.result
            }
        }]).toArray();

        return {
            error: null,
            result: result[0]._expression_result,
            time: Date.now() - started,
            command: output.command,
        };
    } catch (e) {
        const b64error = Buffer.from(e.message).toString('base64');
        const command = `${config.php} ${__dirname}/cli.php parseMongoError ${b64error}`;

        let output;
        try {
            output = JSON.parse(execSync(command, { stdio : 'pipe' }).toString());
            if (output.error) return { ...output, command };
        } catch (e) {
            throw command;
        }

        return {
            error: output.result,
            result: null,
            command: command,
        }
    }
}