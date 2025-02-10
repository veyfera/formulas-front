<?php

use formulas\ErrorTranslator;
use formulas\Expression;
use formulas\Parser;

error_reporting(E_ALL);

spl_autoload_register(function(string $className) {
    $classFile = __DIR__ . '/../php/' . str_replace('\\', '/', $className) . '.php';
    if (file_exists($classFile)) {
        require_once $classFile;
    }
});

if (empty($argv[1])) die("No action specified");
$action = $argv[1];

if ($action === 'parseMongoError') {
    $message = base64_decode($argv[2]);

    echo json_encode([
        'error' => null,
        'result' => ErrorTranslator::parseMongoError($message),
    ], JSON_PRETTY_PRINT);
} else if ($action === 'parseExpression') {
    $code = json_decode(base64_decode($argv[2]))->code;

    echo json_encode(Parser::parseExpression($code), JSON_PRETTY_PRINT);
} else {
    $ast = json_decode(base64_decode($argv[2]), JSON_OBJECT_AS_ARRAY);
    $scope = Expression::decodeDataFromJSON(base64_decode($argv[3]));
    $expression = new Expression($ast, Expression::$LIMIT_MODE_10K);

    if ($action === 'toMongoExpression' || $action === 'preEvaluate') {
        $options = [
            'toMongoExpression' => [
                'testing' => true,
                'preEvaluateSkip' => true,
            ],
            'preEvaluate' => [
                'testing' => true,
                'preEvaluateOnly' => true,
            ],
        ][$action];

        $fieldNames = array_keys((array) $scope);
        echo Expression::encodeDataToJSON($expression->toMongoExpression($scope, $fieldNames, $options), true);
    } else {
        $scopeBefore = Expression::encodeDataToJSON($scope);

        $output = $expression->$action($scope);

        if (Expression::encodeDataToJSON($scope) !== $scopeBefore) {
            die("Scope was mutated");
        }

        $output['code'] = strval($expression);
        echo Expression::encodeDataToJSON($output, true);
    }
}