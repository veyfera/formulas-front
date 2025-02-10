<?php

namespace formulas\functions\text;

use Exception;
use formulas\Convertation;
use formulas\ExpressionNode;
use formulas\expressions\ArrayExpression;
use formulas\functions\AbstractFunction;
use formulas\OptimizedNode;
use formulas\Typing;

class JoinFunction extends AbstractFunction
{
    static $binaryOperatorPrecedence = 8;

    protected int $minArguments = 1;
    protected int $maxArguments = 2;

    public function optimize(): ExpressionNode
    {
        if ($this->arguments[0] instanceof ArrayExpression) {
            if (count($this->arguments) === 1) {
                $flatArguments = []; // Вложенные функции раскрываем в плоский список
                foreach ($this->arguments[0]->array as $node) {
                    if ($node instanceof JoinFunction) {
                        if (count($node->arguments) === 1 && $node->arguments[0] instanceof ArrayExpression) {
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

                $index = 0;
                foreach ($this->arguments[0]->array as $argument) {
                    $optimizedNode = $argument->optimize();

                    if ($optimizedNode instanceof OptimizedNode) {
                        $optimizedNode->result = Convertation::toString($optimizedNode->result);
                        $this->arguments[0]->array[$index] = $optimizedNode;
                    }

                    $index++;
                }
            } else {
                $this->arguments[0] = $this->arguments[0]->optimize();
                $this->arguments[1] = $this->arguments[1]->optimize();
            }
        }

        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        $delimiter = '';
        if (count($this->arguments) > 1) {
            $delimiter = $this->arguments[1]->evaluate($scope);
        }

        if (Typing::isString($input)) {
            return $input;
        } elseif (Typing::isNull($input)) {
            return '';
        } elseif (Typing::isArray($input)) {
            if (!Typing::isString($delimiter)) {
                throw new Exception('fn5 :: join,2nd,' . Typing::getType($delimiter));
            }

            $result = '';

            foreach ($input as $key => $operand) {
                if ($key > 0) $result .= $delimiter;
                if (Typing::isNull($operand)) continue;
                $result .= Convertation::toString($operand);
            }

            return $result;
        } else {
            throw new Exception('fn6 :: join,' . Typing::getType($input));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if ($this->arguments[0] instanceof ArrayExpression && count($this->arguments) === 1) {
            // Вот эту ветку обязательно нужно сохранять максимально краткой, потому что
            // именно она отвечает за оператор &, который будет встречаться часто
            return [
                '$concat' => array_map(
                    fn($node) => [
                        '$convert' => [
                            'input' => $node->toMongoExpression($localVariables, $fieldNames, $options),
                            'to' => 'string',
                            'onNull' => '',
                        ],
                    ],
                    $this->arguments[0]->array
                )
            ];
        } else {
            $input = $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options);

            $delimiter = '';
            if (isset($this->arguments[1])) {
                $delimiter = $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options);
            }

            return [
                '$let' => [
                    'vars' => [
                        'input' => $input,
                        'delimiter' => $delimiter,
                    ],
                    'in' => [
                        '$switch' => [
                            'branches' => [[
                                'case' => ['$eq' => ['$$input', null]],
                                'then' => '',
                            ], [
                                'case' => ['$eq' => [['$type' => '$$input'], 'string']],
                                'then' => '$$input',
                            ], [
                                'case' => ['$ne' => [['$type' => '$$delimiter'], 'string']],
                                'then' => [
                                    '$dateFromString' => [
                                        'dateString' => '$_this_is_missing',
                                        'format' => [[
                                            '$concat' => ['_throw_ fn5,join,2nd,', ['$type' => '$$delimiter']],
                                        ]],
                                    ],
                                ],
                            ], [
                                'case' => ['$isArray' => '$$input'],
                                'then' => [
                                    '$reduce' => [
                                        'input' => '$$input',
                                        'initialValue' => null,
                                        'in' => [
                                            '$concat' => [[
                                                '$cond' => [
                                                    'if' => ['$eq' => ['$$value', null]],
                                                    'then' => '',
                                                    'else' => [
                                                        '$concat' => ['$$value', '$$delimiter']
                                                    ]
                                                ]
                                            ], [
                                                '$convert' => [
                                                    'input' => '$$this',
                                                    'to' => 'string',
                                                    'onNull' => '',
                                                ],
                                            ]],
                                        ]
                                    ],
                                ],
                            ]],
                            'default' => [
                                '$dateFromString' => [
                                    'dateString' => '$_this_is_missing',
                                    'format' => [[
                                        '$concat' => ['_throw_ fn6,join,', ['$type' => '$$input']],
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