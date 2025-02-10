const { execSync } = require('child_process');

const { Expression } = require("../dist/editor.cjs");

const config = require('./config');

module.exports = async function(action, ast, scope) {
    const b64ast = Buffer.from(Expression.encodeDataToJSON(ast)).toString('base64');
    const b64scope = Buffer.from(Expression.encodeDataToJSON(scope)).toString('base64');

    const command = `${config.php} ${__dirname}/cli.php ${action} ${b64ast} ${b64scope}`;

    try {
        return {
            ...Expression.decodeDataFromJSON(execSync(command, { stdio : 'pipe' }).toString()),
            command,
        };
    } catch (e) {
        return {
            error: e.message,
            result: null,
            command,
        }
    }
}