<?php

namespace formulas;

use Exception;
use formulas\expressions\MemberExpression;
use formulas\functions\AbstractFunction;
use formulas\functions\math\SubtractFunction;
use formulas\functions\math\SumFunction;
use formulas\functions\type\NullCoalescingFunction;

class Expression
{
    static private $NODES = [
        'Identifier' => Identifier::class,
        'Number' => literals\NumberLiteral::class,
        'String' => literals\StringLiteral::class,
        'Date' => literals\DateLiteral::class,
        'Boolean' => literals\BooleanLiteral::class,
        'Null' => literals\NullLiteral::class,
        'ObjectExpression' => expressions\ObjectExpression::class,
        'ArrayExpression' => expressions\ArrayExpression::class,
        'MemberExpression' => expressions\MemberExpression::class,
    ];

    static public $FUNCTIONS = [
        'call' => functions\CallFunction::class,
        'map' => functions\arrays\MapFunction::class,
        'filter' => functions\arrays\FilterFunction::class,
        'reduce' => functions\arrays\ReduceFunction::class,
        'count' => functions\arrays\CountFunction::class,
        'reverse' => functions\arrays\ReverseFunction::class,
        'merge' => functions\arrays\MergeFunction::class,
        'range' => functions\arrays\RangeFunction::class,
        'sort' => functions\arrays\SortFunction::class,
        'slice' => functions\arrays\SliceFunction::class,
        'indexOf' => functions\arrays\IndexOfFunction::class,
        'unique' => functions\arrays\UniqueFunction::class,
        'now' => functions\date\NowFunction::class,
        'dateAdd' => functions\date\DateAddFunction::class,
        'dateSubtract' => functions\date\DateSubtractFunction::class,
        'if' => functions\logic\IfFunction::class,
        'not' => functions\logic\NotFunction::class,
        'let' => functions\logic\LetFunction::class,
        'mod' => functions\math\ModFunction::class,
        'multiply' => functions\math\MultiplyFunction::class,
        'sum' => functions\math\SumFunction::class,
        'round' => functions\math\RoundFunction::class,
        'floor' => functions\math\FloorFunction::class,
        'ceil' => functions\math\CeilFunction::class,
        'abs' => functions\math\AbsFunction::class,
        'random' => functions\math\RandomFunction::class,
        'min' => functions\math\MinFunction::class,
        'max' => functions\math\MaxFunction::class,
        'pow' => functions\math\PowFunction::class,
        'sqrt' => functions\math\SqrtFunction::class,
        'log' => functions\math\LogFunction::class,
        'exp' => functions\math\ExpFunction::class,
        'trunc' => functions\math\TruncFunction::class,
        'acos' => functions\trigonometry\AcosFunction::class,
        'acosh' => functions\trigonometry\AcoshFunction::class,
        'asin' => functions\trigonometry\AsinFunction::class,
        'asinh' => functions\trigonometry\AsinhFunction::class,
        'atan2' => functions\trigonometry\Atan2Function::class,
        'atan' => functions\trigonometry\AtanFunction::class,
        'atanh' => functions\trigonometry\AtanhFunction::class,
        'cos' => functions\trigonometry\CosFunction::class,
        'cosh' => functions\trigonometry\CoshFunction::class,
        'sin' => functions\trigonometry\SinFunction::class,
        'sinh' => functions\trigonometry\SinhFunction::class,
        'tan' => functions\trigonometry\TanFunction::class,
        'tanh' => functions\trigonometry\TanhFunction::class,
        'join' => functions\text\JoinFunction::class,
        'length' => functions\text\LengthFunction::class,
        'substr' => functions\text\SubstrFunction::class,
        'locate' => functions\text\LocateFunction::class,
        'trim' => functions\text\TrimFunction::class,
        'trimStart' => functions\text\TrimStartFunction::class,
        'trimEnd' => functions\text\TrimEndFunction::class,
        'split' => functions\text\SplitFunction::class,
        'replace' => functions\text\ReplaceFunction::class,
        'replaceAll' => functions\text\ReplaceAllFunction::class,
        'lower' => functions\text\LowerFunction::class,
        'upper' => functions\text\UpperFunction::class,
        'regexTest' => functions\text\RegexTestFunction::class,
        'regexMatch' => functions\text\RegexMatchFunction::class,
        'regexMatchAll' => functions\text\RegexMatchAllFunction::class,
        'toBoolean' => functions\type\ToBooleanFunction::class,
        'toString' => functions\type\ToStringFunction::class,
        'toNumber' => functions\type\ToNumberFunction::class,
        'toDate' => functions\type\ToDateFunction::class,
        'type' => functions\type\TypeFunction::class,
        'exists' => functions\type\ExistsFunction::class,
        'objectToArray' => functions\objects\ObjectToArrayFunction::class,
        'arrayToObject' => functions\objects\ArrayToObjectFunction::class,
        'pickKeys' => functions\objects\PickKeysFunction::class,
    ];

    static public $BINARY_OPERATORS = [
        '&' => functions\text\JoinFunction::class,
        '+' => functions\math\SumFunction::class,
        '-' => functions\math\SubtractFunction::class,
        '*' => functions\math\MultiplyFunction::class,
        '/' => functions\math\DivideFunction::class,
        '%' => functions\math\ModFunction::class,
        '==' => functions\compare\EqualFunction::class,
        '!=' => functions\compare\NotEqualFunction::class,
        '>' => functions\compare\GreaterFunction::class,
        '>=' => functions\compare\GreaterOrEqualFunction::class,
        '<' => functions\compare\LessFunction::class,
        '<=' => functions\compare\LessOrEqualFunction::class,
        'or' => functions\logic\OrFunction::class,
        'and' => functions\logic\AndFunction::class,
        '??' => functions\type\NullCoalescingFunction::class,
        'in' => functions\arrays\InFunction::class,
    ];

    static public $UNARY_OPERATORS = [
        '+' => functions\math\SumFunction::class,
        '-' => functions\math\SubtractFunction::class,
    ];

    protected array $ast;

    /**
     * @var string Это поле нужно, чтобы при экспорте объекта в JSON оно светилось,
     * и так можно было между собой формулы легко сравнивать
     */
    public string $code;

    /** @var int Режим без ограничений по выполнению */
    static $LIMIT_MODE_NONE = 0;

    /** @var int Выполнение ограничено 10 000 вызовами функций */
    static $LIMIT_MODE_10K = 1;

    /** @var int Выполнение ограничено 1 000 000 вызовов функций */
    static $LIMIT_MODE_1M = 2;

    protected int $limitMode = 0;

    /**
     * @param array|object $ast
     * @param int $limitMode
     */
    public function __construct($ast, int $limitMode)
    {
        if (is_array($ast)) {
            $this->ast = $ast;
        } elseif (is_object($ast)) {
            $this->ast = static::objectToArray($ast);
        } else {
            throw new \InvalidArgumentException('Invalid type of $ast argument: ' . gettype($ast));
        }
        $this->code = $this->ast['code'];
        $this->limitMode = $limitMode;
    }

    protected static function objectToArray($value)
    {
        if (is_array($value) || is_object($value)) {
            $result = [];
            foreach ($value as $k => $v) {
                $result[$k] = static::objectToArray($v);
            }
            return $result;
        } else {
            return $value;
        }
    }

    protected static function arrayToObject($value, bool $emptyArrayIsObject)
    {
        $isArray = is_array($value);
        $isNumericArray = $isArray ? static::isNumericArray($value, !$emptyArrayIsObject) : false;
        $isObject = $isArray ? false : is_object($value);

        if ($isNumericArray) {
            $result = [];
            foreach ($value as $k => $v) {
                $result[$k] = static::arrayToObject($v, $emptyArrayIsObject);
            }
            return $result;
        }

        if ($isArray || $isObject) {
            $result = new \stdClass;
            foreach ($value as $k => $v) {
                $result->$k = static::arrayToObject($v, $emptyArrayIsObject);
            }
            return $result;
        }

        return $value;
    }

    protected static function isNumericArray($array, bool $emptyArrayIsNumeric): bool
    {
        if (!is_array($array)) {
            return false;
        }

        $arraySize = count($array);

        if ($arraySize === 0) {
            return $emptyArrayIsNumeric;
        }

        $arrayKeys = array_flip(array_keys($array));
        for ($j = 0; $j < $arraySize; $j++) {
            if (!isset($arrayKeys[$j])) {
                return false;
            }
        }
        return true;
    }

    public function isEmpty(): bool
    {
        return $this->ast['error'] === null && $this->ast['source'] === null;
    }

    public function makeNode(array $source): ExpressionNode
    {
        if (!isset($source['type'])) {
            throw new Exception('Node without type');
        }

        if ($source['type'] === 'CallExpression') {
            if (!isset($source['arguments'])) {
                throw new Exception('Call expression without arguments');
            }

            if (!isset($source['callee'])) {
                throw new Exception('Call expression without callee');
            }

            if (!isset(self::$FUNCTIONS[$source['callee']])) {
                throw new Exception('Unknown function call');
            }

            return new self::$FUNCTIONS[$source['callee']]($this, $source['arguments']);
        } elseif ($source['type'] === 'UnaryExpression') {
            if (!isset($source['argument'])) {
                throw new Exception('Unary operator without argument');
            }

            if (!isset($source['operator'])) {
                throw new Exception('Unary operator without operator');
            }

            if ($source['operator'] === '+') {
                return new SumFunction($this, [[
                    'type' => 'ArrayExpression',
                    'elements' => [['type' => 'Number', 'value' => 0], $source['argument']],
                ]]);
            } elseif ($source['operator'] === '-') {
                return new SubtractFunction($this, [['type' => 'Number', 'value' => 0], $source['argument']]);
            } elseif ($source['operator'] === '?') {
                return new NullCoalescingFunction($this, [$source['argument'], ['type' => 'Null']]);
            } else {
                throw new Exception('Unknown unary operator');
            }
        } elseif ($source['type'] === 'BinaryExpression') {
            if (!isset($source['left'])) {
                throw new Exception('Binary operator without left');
            }

            if (!isset($source['right'])) {
                throw new Exception('Binary operator without right');
            }

            if (!isset(self::$BINARY_OPERATORS[$source['operator']])) {
                throw new Exception('Unknown binary operator');
            }

            if (in_array($source['operator'], ['&', '+', '*'])) {
                // Для некоторых операторов мы аргументы оборачиваем в массив
                $args = [[
                    'type' => 'ArrayExpression',
                    'elements' => [$source['left'], $source['right']],
                ]];
            } else {
                $args =  [$source['left'], $source['right']];
            }

            return new self::$BINARY_OPERATORS[$source['operator']]($this, $args);
        }

        if (!isset(self::$NODES[$source['type']])) {
            throw new Exception('Unknown node type');
        }

        return new self::$NODES[$source['type']]($this, $source);
    }

    public $evaluationCounter = 0;

    protected function resetEvaluationLimits()
    {
        $this->evaluationCounter = 0;
    }

    public function checkEvaluationLimits(ExpressionNode $node)
    {
        if ($this->limitMode && $node instanceof AbstractFunction) {
            $this->evaluationCounter++;

            if ($this->limitMode === self::$LIMIT_MODE_10K && $this->evaluationCounter > 10_000) {
                throw new Exception('Limit 10k exceeded');
            }

            if ($this->limitMode === self::$LIMIT_MODE_1M && $this->evaluationCounter > 1_000_000) {
                throw new Exception('Limit 1 million exceeded');
            }
        }
    }

    public function evaluate(object $scope)
    {
        $this->resetEvaluationLimits();

        $started = microtime(1);

        if ($this->isEmpty()) {
            return [
                'error' => null,
                'result' => null,
                'time' => round((microtime(1) - $started) * 1000),
            ];
        }

        if ($this->ast['error'] === null) {
            try {
                $rootNode = $this->makeNode($this->ast['source']);

                try {
                    $optimizedNode = $rootNode->optimize();

                    try {
                        return [
                            'error' => null,
                            'result' => $optimizedNode->evaluate($scope),
                            'time' => round((microtime(1) - $started) * 1000),
                        ];
                    } catch (Exception $e) {
                        return [
                            'error' => 'evaluate :: ' . $e->getMessage(),
                            'result' => null,
                            'time' => round((microtime(1) - $started) * 1000),
                        ];
                    }
                } catch (Exception $e) {
                    return [
                        'error' => 'optimize :: ' . $e->getMessage(),
                        'result' => null,
                        'time' => round((microtime(1) - $started) * 1000),
                    ];
                }
            } catch (Exception $e) {
                return [
                    'error' => 'validate :: ' . $e->getMessage(),
                    'result' => null,
                    'time' => round((microtime(1) - $started) * 1000),
                ];
            }
        } else {
            return [
                'error' => 'parse :: ' . $this->ast['error']['message'],
                'result' => null,
                'time' => round((microtime(1) - $started) * 1000),
            ];
        }
    }

    public function evaluatePath(object $scope)
    {
        $this->resetEvaluationLimits();

        $started = microtime(1);

        if ($this->isEmpty()) {
            return [
                'error' => null,
                'result' => [],
                'time' => round((microtime(1) - $started) * 1000),
            ];
        }

        if ($this->ast['error'] === null) {
            try {
                $rootNode = $this->makeNode($this->ast['source']);

                if ($rootNode instanceof Identifier) {
                    return [
                        'error' => null,
                        'result' => [$rootNode->name],
                        'time' => round((microtime(1) - $started) * 1000),
                    ];
                } elseif ($rootNode instanceof MemberExpression) {
                    try {
                        return [
                            'error' => null,
                            'result' => $rootNode->evaluatePath($scope),
                            'time' => round((microtime(1) - $started) * 1000),
                        ];
                    } catch (Exception $e) {
                        return [
                            'error' => 'evaluate :: ' . $e->getMessage(),
                            'result' => null,
                            'time' => round((microtime(1) - $started) * 1000),
                        ];
                    }
                } else {
                    return [
                        'error' => 'evaluate :: pathTypeError',
                        'result' => null,
                        'time' => round((microtime(1) - $started) * 1000),
                    ];
                }
            } catch (Exception $e) {
                return [
                    'error' => 'validate :: ' . $e->getMessage(),
                    'result' => null,
                    'time' => round((microtime(1) - $started) * 1000),
                ];
            }
        } else {
            return [
                'error' => 'parse :: ' . $this->ast['error']['message'],
                'result' => null,
                'time' => round((microtime(1) - $started) * 1000),
            ];
        }
    }

    public function evaluateToBoolean(object $scope) {
        $output = $this->evaluate($scope);
        if ($output['error']) return $output;

        try {
            return [
                'error' => null,
                'result' => Convertation::toBoolean($output['result'])
            ];
        } catch (Exception $e) {
            return [
                'error' => 'finalize :: ' . $e->getMessage(),
                'result' => null
            ];
        }
    }

    public function evaluateToString(object $scope) {
        $output = $this->evaluate($scope);
        if ($output['error']) return $output;

        try {
            return [
                'error' => null,
                'result' => Convertation::toString($output['result'])
            ];
        } catch (Exception $e) {
            return [
                'error' => 'finalize :: ' . $e->getMessage(),
                'result' => null
            ];
        }
    }

    public function evaluateToNumber(object $scope) {
        $output = $this->evaluate($scope);
        if ($output['error']) return $output;

        try {
            return [
                'error' => null,
                'result' => Convertation::toNumber($output['result'])
            ];
        } catch (Exception $e) {
            return [
                'error' => 'finalize :: ' . $e->getMessage(),
                'result' => null
            ];
        }
    }

    public function evaluateToTable(object $scope) {
        $output = $this->evaluate($scope);
        if ($output['error']) return $output;

        try {
            return [
                'error' => null,
                'result' => ToTable::perform($output['result'])
            ];
        } catch (Exception $e) {
            return [
                'error' => 'finalize :: ' . $e->getMessage(),
                'result' => null
            ];
        }
    }

    /**
     * @param $input mixed JSON + даты
     * @param $indent string|false,
     * @return string
     * @throws Exception
     */
    static function prettyPrint($input, $indent = '')
    {
        $noIndent = $indent === false;
        $nextIndent = $noIndent ? false : $indent . '  ';

        if (Typing::isObject($input)) {
            if (count((array) $input) === 0) return '{}';
            else {
                $lines = [];

                foreach ($input as $key => $value) {
                    $lines[] = implode([
                        $noIndent ? '' : $nextIndent,
                        json_encode($key),
                        ': ',
                        self::prettyPrint($value, $nextIndent)
                    ]);
                }

                return implode([
                    $noIndent ? '{' : '{\n',
                    implode($noIndent ? ', ' : ',\n', $lines),
                    $noIndent ? '}' : '\n' . $indent . '}',
                ]);
            }
        } elseif (Typing::isArray($input)) {
            if (count($input) === 0) return '[]';
            else {
                $lines = [];
                foreach ($input as $value) {
                    $lines[] = implode([
                        $noIndent ? '' : $nextIndent,
                        self::prettyPrint($value, $nextIndent)
                    ]);
                }

                return implode([
                    $noIndent ? '[' : '[\n',
                    implode($noIndent ? ', ' : ',\n', $lines),
                    $noIndent ? ']' : '\n' . $indent . ']',
                ]);
            }
        } elseif (Typing::isDate($input)) {
            return '#' . Convertation::toString($input) . '#';
        } elseif (Typing::isString($input)) {
            return json_encode(Convertation::toString($input));
        } elseif (Typing::isNumber($input)) {
            return Convertation::toString($input);
        } elseif (Typing::isNull($input)) {
            return 'null';
        } elseif (Typing::isBoolean($input)) {
            return Convertation::toString($input);
        } else {
            throw new Exception('Unknown type');
        }
    }

    static function encodeTypes($object)
    {
        if (Typing::isDate($object)) {
            return [
                '__formula_encoded_type__' => 'date',
                'date' => Convertation::toString($object),
            ];
        } elseif (is_array($object)) {
            foreach ($object as $key => $item) {
                $object[$key] = self::encodeTypes($item);
            }

            return $object;
        } elseif (is_object($object)) {
            $clone = new \stdClass();

            foreach ($object as $key => $item) {
                $clone->$key = self::encodeTypes($item);
            }

            return $clone;
        } elseif (Typing::isNaN($object)) {
            return [
                '__formula_encoded_type__' => 'NaN',
            ];
        } elseif ($object === INF) {
            return [
                '__formula_encoded_type__' => 'Infinity',
            ];
        } elseif ($object === -INF) {
            return [
                '__formula_encoded_type__' => '-Infinity',
            ];
        } else {
            return $object;
        }
    }

    static function encodeDataToJSON($object, $pretty = false)
    {
        return json_encode(self::encodeTypes($object), $pretty ? JSON_PRETTY_PRINT : 0);
    }

    static function decodeTypes($object)
    {
        if (isset($object->__formula_encoded_type__)) {
            if ($object->__formula_encoded_type__ === 'date') {
                return Convertation::toDate($object->date ?? $object->timestamp);
            } elseif ($object->__formula_encoded_type__ === 'NaN') {
                return NAN;
            } elseif ($object->__formula_encoded_type__ === 'Infinity') {
                return INF;
            } elseif ($object->__formula_encoded_type__ === '-Infinity') {
                return -INF;
            } else return $object;
        } elseif (is_array($object)) {
            foreach ($object as $key => $item) {
                $object[$key] = self::decodeTypes($item);
            }

            return $object;
        } elseif (is_object($object)) {
            foreach ($object as $key => $item) {
                $object->$key = self::decodeTypes($item);
            }

            return $object;
        } else {
            return $object;
        }
    }

    static function decodeDataFromJSON(string $source)
    {
        $object = json_decode($source, false, 512, JSON_THROW_ON_ERROR);
        return self::decodeTypes($object);
    }

    public function toMongoExpression(object $scope, array $fieldNames, array $options = [])
    {
        if (empty($options['testing'])) $options['testing'] = false;

        if ($this->isEmpty()) {
            return [
                'error' => null,
                'result' => null
            ];
        }

        // wrap to toBoolean, потому что пустая строка вернет не тот результат?

        if ($this->ast['error'] === null) {
            try {
                $rootNode = $this->makeNode($this->ast['source']);

                try {
                    if (!($options['preEvaluateSkip'] ?? false)) {
                        // Предварительное выполнение для тестов не делаем, чтобы все операции
                        // именно сама монга выполняла, а не PHP на этапе preEvaluate
                        $rootNode = $rootNode->preEvaluate([], $scope);
                    }
                } catch (Exception $e) {
                    return [
                        'error' => 'preeval :: ' . $e->getMessage(),
                        'result' => null
                    ];
                }

                try {
                    if ($options['preEvaluateOnly'] ?? false) {
                        return [
                            'error' => null,
                            'result' => $rootNode->toCode()
                        ];
                    } else {
                        return [
                            'error' => null,
                            'result' => $rootNode->toMongoExpression([], $fieldNames, $options)
                        ];
                    }
                } catch (Exception $e) {
                    return [
                        'error' => 'convert :: ' . $e->getMessage(),
                        'result' => null
                    ];
                }
            } catch (Exception $e) {
                return [
                    'error' => 'validate :: ' . $e->getMessage(),
                    'result' => null
                ];
            }
        } else {
            return [
                'error' => 'parse :: ' . $this->ast['error']['message'],
                'result' => null,
            ];
        }
    }

    static function astToCode(array $source)
    {
        if ($source['type'] === 'BinaryExpression') {
            return implode([
                '(',
                self::astToCode($source['left']),
                ' ' . $source['operator'] . ' ',
                self::astToCode($source['right']),
                ')',
            ]);
        } elseif ($source['type'] === 'CallExpression') {
            return implode([
                $source['callee'],
                '(',
                implode(', ', array_map(
                    fn($arg) => self::astToCode($arg), $source['arguments']
                )),
                ')',
            ]);
        } elseif ($source['type'] === 'UnaryExpression') {
            return implode([
                '(',
                $source['operator'],
                self::astToCode($source['argument']),
                ')',
            ]);
        } elseif ($source['type'] === 'MemberExpression') {
            return implode([
                self::astToCode($source['object']),
                '[',
                self::astToCode($source['property']),
                ']',
            ]);
        } elseif ($source['type'] === 'ArrayExpression') {
            return implode([
                '[',
                implode(', ', array_map(
                    fn($el) => self::astToCode($el), $source['elements']
                )),
                ']',
            ]);
        } elseif ($source['type'] === 'ObjectExpression') {
            return implode([
                '{',
                implode(', ', array_map(
                    fn($prop) => json_encode($prop['key']) . ': ' . self::astToCode($prop['value']),
                    $source['properties']
                )),
                '}',
            ]);
        } elseif ($source['type'] === 'Identifier') {
            return $source['name'];
        } elseif ($source['type'] === 'Number') {
            return strval($source['value']);
        } elseif ($source['type'] === 'String') {
            return json_encode($source['value']);
        } elseif ($source['type'] === 'Date') {
            return '#' . $source['value'] . '#';
        } elseif ($source['type'] === 'Boolean') {
            return $source['value'] ? 'true' : 'false';
        } elseif ($source['type'] === 'Null') {
            return 'null';
        } else {
            throw new Exception('Unknown node type');
        }
    }

    public function __toString()
    {
        if ($this->isEmpty()) {
            return '';
        } else {
            return self::astToCode($this->ast['source']);
        }
    }

    /**
     * @param bool $asArray
     * @return array|object
     */
    public function getAst(bool $asArray = true)
    {
        if ($asArray) {
            return $this->ast;
        } else {
            return static::arrayToObject($this->ast, true);
        }
    }
}
