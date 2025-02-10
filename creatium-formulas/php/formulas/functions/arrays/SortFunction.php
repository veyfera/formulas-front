<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\Comparison;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class SortFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 2;

    public function optimize(): ExpressionNode
    {
        foreach ($this->arguments as $index => $argument) {
            $this->arguments[$index] = $argument->optimize();
        }

        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($input)) {
            return null;
        } elseif (Typing::isArray($input)) {
            if (count($this->arguments) > 1) {
                $wrapped = [];

                foreach ($input as $item) {
                    $childScope = clone $scope;
                    $childScope->item = $item;
                    $wrapped[] = [
                        'item' => $item,
                        'order' => $this->arguments[1]->evaluate($childScope),
                    ];
                }

                uasort($wrapped, function ($a, $b) {
                    if (Comparison::isGreater($a['order'], $b['order'])) return 1;
                    elseif (Comparison::isLess($a['order'], $b['order'])) return -1;
                    else return 0;
                });

                $result = [];

                foreach ($wrapped as $wrappedItem) {
                    $result[] = $wrappedItem['item'];
                }
            } else {
                uasort($input, function ($a, $b) {
                    if (Comparison::isGreater($a, $b)) return 1;
                    elseif (Comparison::isLess($a, $b)) return -1;
                    else return 0;
                });

                $result = array_values($input);
            }

            return $result;
        } else {
            throw new Exception('fn1 :: sort,' . Typing::getType($input));
        }
    }

    public function localVariableList()
    {
        return ['item'];
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if (count($this->arguments) > 1) {
            $nestedLocalVariables = $localVariables;
            $nestedLocalVariables['item'] = 'item';

            return [
                '$let' => [
                    'vars' => [
                        'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options)
                    ],
                    'in' => [
                        '$switch' => [
                            'branches' => [[
                                'case' => ['$eq' => ['$$input', null]],
                                'then' => null,
                            ], [
                                'case' => ['$isArray' => '$$input'],
                                'then' => [
                                    '$map' => [
                                        'input' => [
                                            '$sortArray' => [
                                                'input' => [
                                                    '$map' => [
                                                        'input' => '$$input',
                                                        'as' => 'item',
                                                        'in' => [
                                                            'item' => '$$item',
                                                            'order' => $this->arguments[1]->toMongoExpression($nestedLocalVariables, $fieldNames, $options),
                                                        ],
                                                    ],
                                                ],
                                                'sortBy' => [
                                                    'order' => 1
                                                ]
                                            ],
                                        ],
                                        'as' => 'wrappedArrayElement',
                                        'in' => '$$wrappedArrayElement.item',
                                    ],
                                ],
                            ]],
                            'default' => [
                                '$dateFromString' => [
                                    'dateString' => '$_this_is_missing',
                                    'format' => [[
                                        '$concat' => ['_throw_ fn1,sort,', ['$type' => '$$input']],
                                    ]],
                                ],
                            ],
                        ],
                    ],
                ]
            ];
        } else {
            return [
                '$sortArray' => [
                    'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                    'sortBy' => 1
                ],
            ];
        }
    }
}