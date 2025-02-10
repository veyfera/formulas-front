<?php

namespace formulas\expressions;

use Exception;
use formulas\Expression;
use formulas\Identifier;
use formulas\OptimizedNode;
use formulas\Typing;
use formulas\ExpressionNode;

class MemberExpression extends ExpressionNode
{
    private ExpressionNode $object;
    private ExpressionNode $property;

    public bool $nullSafe = true;

    public bool $existsMode = false;

    public function __construct(Expression $Expr, $node)
    {
        parent::__construct($Expr);

        if (!isset($node['object'])) {
            throw new Exception('Member expression without object');
        }

        if (!isset($node['property'])) {
            throw new Exception('Member expression without property');
        }

        $this->object = $this->Expr->makeNode($node['object']);
        $this->property = $this->Expr->makeNode($node['property']);
    }

    public function disableNullSafety()
    {
        $this->nullSafe = false;

        if ($this->object instanceof MemberExpression) {
            $this->object->disableNullSafety();
        }
    }

    public function enableExistsMode()
    {
        $this->existsMode = true;

        if ($this->object instanceof MemberExpression || $this->object instanceof Identifier) {
            $this->object->enableExistsMode();
        }
    }

    public function optimize(): ExpressionNode
    {
        $this->object = $this->object->optimize();
        $this->property = $this->property->optimize();

        // Странно, но монга не идет дальше этого и не оптимизирует до конца

        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $object = $this->object->evaluate($scope);
        $property = $this->property->evaluate($scope);

        if (Typing::isNull($object) && $this->nullSafe === false) {
            return null; // TODO?
        } elseif (Typing::isArray($object) && Typing::isNumber($property)) {
            if (Typing::is32BitInteger($property)) {
                $propertyFixed = intval($property);

                if ($property < 0) {
                    $propertyFixed = count($object) + $propertyFixed;
                }

                if (array_key_exists($propertyFixed, $object)) {
                    return $object[$propertyFixed];
                } else {
                    if ($this->nullSafe) {
                        if ($this->existsMode) {
                            throw new Exception('undefined');
                        } else {
                            throw new Exception('member2 :: ' . $property);
                        }
                    } else {
                        return null;
                    }
                }
            } else {
                throw new Exception('member3');
            }
        } elseif (Typing::isObject($object) && Typing::isString($property)) {
            if (property_exists($object, $property) || isset($object->$property)) {
                return $object->$property;
            } else {
                if ($this->nullSafe) {
                    if ($this->existsMode) {
                        throw new Exception('undefined');
                    } else {
                        throw new Exception('member2 :: ' . $property);
                    }
                } else {
                    return null;
                }
            }
        } else {
            if ($this->existsMode) {
                throw new Exception('undefined');
            } else {
                throw new Exception('member1 :: ' . Typing::getType($object) . ',' . Typing::getType($property));
            }
        }
    }

    public function evaluateExists($scope)
    {
        try {
            $this->evaluate($scope);
            return true;
        } catch (Exception $e) {
            if ($e->getMessage() === 'undefined') {
                return false;
            }

            throw $e;
        }
    }

    public function evaluatePath($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        if ($this->object instanceof Identifier) {
            $path = [$this->object->name];
        } elseif ($this->object instanceof MemberExpression) {
            $path = $this->object->evaluatePath($scope);
        } else {
            throw new Exception('pathTypeError');
        }

        $path[] = $this->property->evaluate($scope);

        return $path;
    }

    public function gatherExternalIdentifiers()
    {
        return array_merge(
            $this->object->gatherExternalIdentifiers(),
            $this->property->gatherExternalIdentifiers()
        );
    }

    public function preEvaluate(array $localVariables, object $scope): ExpressionNode
    {
        $this->object = $this->object->preEvaluate($localVariables, $scope);
        $this->property = $this->property->preEvaluate($localVariables, $scope);

        if ($this->object instanceof OptimizedNode) {
            if ($this->property instanceof OptimizedNode) {
                return new OptimizedNode($this, $scope);
            }
        }

        return $this;
    }

    public function toCode(): string
    {
        return implode([
            $this->object->toCode(),
            '[',
            $this->property->toCode(),
            ']',
        ]);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        $input = $this->object->toMongoExpression($localVariables, $fieldNames, $options);
        $field = $this->property->toMongoExpression($localVariables, $fieldNames, $options);

        if (is_array($field) && isset($field['$literal']) && Typing::isString($field['$literal'])) {
            if (strpos($field['$literal'], '$') === false && strpos($field['$literal'], '.') === false) {
                $getFieldExpression = '$$input' . '.' . $field['$literal'];
            } else {
                $getFieldExpression = [
                    '$getField' => [
                        'input' => '$$input',
                        'field' => $field,
                    ]
                ];
            }
        } else {
            // TODO: Starting in MongoDB 7.2, you can specify any valid expression that resolves to a string for the
            // TODO: field input of the $getField operator. In earlier versions, field accepts only string constants
            // TODO: по идее теперь можно обойтись без этого костыли
            $getFieldExpression = [
                '$getField' => [
                    'input' => [
                        '$first' => [
                            '$filter' => [
                                'input' => ['$objectToArray' => '$$input'],
                                'as' => 'item',
                                'cond' => ['$eq' => ['$$item.k', '$$field']]
                            ]
                        ],
                    ],
                    'field' => 'v',
                ],
            ];
        }

        return [
            '$let' => [
                'vars' => [
                    'input' => $input,
                    'field' => $field,
                ],
                'in' => [
                    '$let' => [
                        'vars' => [
                            'result' => [
                                '$switch' => [
                                    'branches' => [[
                                        'case' => ['$and' => [
                                            ['$isArray' => '$$input'],
                                            ['$isNumber' => '$$field'],
                                        ]],
                                        'then' => ['$arrayElemAt' => ['$$input', '$$field']],
                                    ], [
                                        'case' => ['$and' => [
                                            ['$eq' => [['$type' => '$$input'], 'object']],
                                            ['$eq' => [['$type' => '$$field'], 'string']],
                                        ]],
                                        'then' => $getFieldExpression,
                                    ], [
                                        'case' => ['$and' => [
                                            ['$eq' => ['$$input', null]],
                                            !$this->existsMode && $this->nullSafe === false,
                                        ]],
                                        'then' => null,
                                    ]],
                                    'default' => $this->existsMode ? '$_this_is_missing' : [
                                        '$dateFromString' => [
                                            'dateString' => '$_this_is_missing',
                                            'format' => [[
                                                '$concat' => [
                                                    '_throw_ member1,',
                                                    ['$type' => '$$input'], ',', ['$type' => '$$field'],
                                                ],
                                            ]],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'in' => $this->existsMode ? '$$result' : ['$ifNull' => ['$$result', [
                            '$cond' => [
                                'if' => ['$eq' => [['$type' => '$$result'], 'missing']],
                                'then' => $this->nullSafe ? [
                                    '$dateFromString' => [
                                        'dateString' => '$_this_is_missing',
                                        'format' => [[
                                            '$concat' => ['_throw_ member2,', ['$toString' => '$$field']],
                                        ]],
                                    ],
                                ] : null,
                                'else' => null,
                            ],
                        ]]],
                    ]
                ],
            ]
        ];
    }
}