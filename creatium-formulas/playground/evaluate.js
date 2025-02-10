const mongo_evaluate = require('../test/mongo.evaluate');
const php_evaluate = require('../test/php.evaluate');
const node_evaluate = require('../test/node.evaluate');

const { parseExpression, Expression } = require("../dist/editor.cjs");

module.exports = async function evaluate(str_formula, str_scope) {
    const json_scope = JSON.parse(str_scope);

    const ast = parseExpression(str_formula);

    const result_mongo = await mongo_evaluate(ast, json_scope);
    const result_php = await php_evaluate('evaluate', ast, json_scope);
    const result_node = node_evaluate('evaluate', ast, json_scope);

    if (result_mongo.error) {
        result_mongo.errorRu = Expression.ErrorTranslator.toRussian(result_mongo.error);
    }

    const result = Expression.encodeTypes(result_mongo.result);

    let same = true;
    if (JSON.stringify(result_mongo.result) !== JSON.stringify(result_php.result)) same = false;
    if (JSON.stringify(result_mongo.error) !== JSON.stringify(result_php.error)) same = false;
    if (JSON.stringify(result_mongo.result) !== JSON.stringify(result_node.result)) same = false;
    if (JSON.stringify(result_mongo.error) !== JSON.stringify(result_node.error)) same = false;

    return {
        mongoExpression1: await php_evaluate('toMongoExpression', ast, json_scope),
        mongoExpression2: await php_evaluate('preEvaluate', ast, json_scope),
        results: {
            same: same,
            mongo: result_mongo,
            php: result_php,
            node: result_node,
        },
        ast: ast,
        result: result,
    };
}