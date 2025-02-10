const { parseExpression } = require("../dist/editor.cjs.js");

if (process.argv[2] === 'parse') {
    const input = Buffer.from(process.argv[3], 'base64').toString('ascii');
    const output = JSON.stringify(parseExpression(input));

    console.log(output);
}