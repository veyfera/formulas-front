const { Expression } = require("../dist/editor.cjs");

module.exports = function (action, ast, scope) {
    try {
        const astBefore = Expression.encodeDataToJSON(ast);
        const scopeBefore = Expression.encodeDataToJSON(scope);

        const result = new Expression(ast, Expression.LIMIT_MODE_10K)[action](scope);

        if (astBefore !== Expression.encodeDataToJSON(ast)) {
            throw new Error('Ast was mutated');
        }

        if (scopeBefore !== Expression.encodeDataToJSON(scope)) {
            throw new Error('Scope was mutated');
        }

        return result;
    } catch (e) {
        return {
            error: e.message,
            result: null,
        };
    }
}