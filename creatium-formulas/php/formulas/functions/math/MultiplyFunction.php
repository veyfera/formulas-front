<?php

namespace formulas\functions\math;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;
use formulas\ExpressionNode;
use formulas\expressions\ArrayExpression;
use formulas\OptimizedNode;

class MultiplyFunction extends AbstractFunction
{
    static $binaryOperatorPrecedence = 10;

    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function optimize(): ExpressionNode
    {
        if ($this->arguments[0] instanceof ArrayExpression) {
            $flatArguments = []; // Вложенные функции раскрываем в плоский список
            foreach ($this->arguments[0]->array as $node) {
                if ($node instanceof MultiplyFunction) {
                    if ($node->arguments[0] instanceof ArrayExpression) {
                        foreach ($node->arguments[0]->array as $nestedNode) {
                            $flatArguments[] = $nestedNode;
                        }
                    } else {
                        $flatArguments[] = $node;
                    }
                } else {
                    $flatArguments[] = $node;
                }
            }
            $this->arguments[0]->array = $flatArguments;

            $argumentsToOptimize = [];
            $argumentsToNotOptimize = [];

            foreach ($this->arguments[0]->array as $argument) {
                $optimizedNode = $argument->optimize();

                if ($optimizedNode instanceof OptimizedNode) {
                    $argumentsToOptimize[] = $optimizedNode;
                } else {
                    $argumentsToNotOptimize[] = $optimizedNode;
                }
            }

            if (count($argumentsToOptimize)) {
                if (count($argumentsToOptimize) > 1) {
                    $this->arguments[0]->array = $argumentsToOptimize;
                    $argumentsToOptimize = [new OptimizedNode($this)];
                }

                $this->arguments[0]->array = array_merge($argumentsToNotOptimize, $argumentsToOptimize);
            }

            if (!count($argumentsToNotOptimize)) {
                return new OptimizedNode($this);
            }
        }

        return $this;
    }

    private $result;

    private function multiply($operand)
    {
        if (Typing::isNull($operand)) {
            return null;
        } elseif (Typing::isNumber($operand)) {
            // Mongo не умеет умножать конечные числа больше этого диапазона
            if (Typing::isFinite($operand)) {
                if ($operand > Typing::$MONGO_LONG_MAX || $operand < Typing::$MONGO_LONG_MIN) {
                    throw new Exception("general1");
                }
            }

            return $this->result *= $operand;
        } else {
            throw new Exception('fn7 :: multiply,' . Typing::getType($operand));
        }
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $this->result = 1;

        if ($this->arguments[0] instanceof ArrayExpression) {
            foreach ($this->arguments[0]->array as $argument) {
                if ($this->multiply($argument->evaluate($scope)) === null) return null;
            }
        } else {
            $input = $this->arguments[0]->evaluate($scope);

            if (Typing::isNull($input)) {
                return null;
            } elseif (Typing::isArray($input)) {
                foreach ($input as $operand) {
                    if ($this->multiply($operand) === null) return null;
                }
            } else {
                throw new Exception('fn7 :: multiply,' . Typing::getType($input));
            }
        }

        return $this->result;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if ($this->arguments[0] instanceof ArrayExpression) {
            return [
                '$multiply' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
            ];
        } else {
            return [
                '$let' => [
                    'vars' => [
                        'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                    ],
                    'in' => [
                        '$switch' => [
                            'branches' => [[
                                'case' => ['$eq' => ['$$input', null]],
                                'then' => null,
                            ], [
                                'case' => ['$isArray' => '$$input'],
                                'then' => [
                                    '$reduce' => [
                                        'input' => '$$input',
                                        'initialValue' => 1,
                                        'in' => [
                                            '$multiply' => ['$$value', '$$this'],
                                        ]
                                    ],
                                ],
                            ]],
                            'default' => [
                                '$dateFromString' => [
                                    'dateString' => '$_this_is_missing',
                                    'format' => [[
                                        '$concat' => ['_throw_ fn7,multiply,', ['$type' => '$$input']],
                                    ]],
                                ],
                            ],
                        ],
                    ],
                ],
            ];
        }
    }
}