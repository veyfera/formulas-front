const { execSync } = require('child_process');

const { Expression } = require("../dist/editor.cjs");

const config = require('./config');

module.exports = async function(action, code) {
    const b64code = Buffer.from(Expression.encodeDataToJSON(code)).toString('base64');
    const command = `${config.php} ${__dirname}/cli.php ${action} ${b64code}`;

    try {
        const output = Expression.decodeDataFromJSON(execSync(command, { stdio : 'pipe' }).toString());

        return {
            result: output.source,
            error: output.error,
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