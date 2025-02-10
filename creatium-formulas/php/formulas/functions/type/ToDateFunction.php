<?php

namespace formulas\functions\type;

use formulas\Convertation;
use formulas\functions\AbstractFunction;
use formulas\Typing;
use formulas\ExpressionNode;

class ToDateFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 2;

    public function optimize(): ExpressionNode
    {
        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return Convertation::toDate($this->arguments[0]->evaluate($scope));
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$let' => [
                'vars' => [
                    'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options)
                ],
                'in' => [
                    '$switch' => [
                        'branches' => [[
                            // Mongo не умеет делать $toDate с типом int
                            'case' => ['$isNumber' => '$$input'],
                            'then' => [
                                '$convert' => [
                                    'input' => [
                                        '$cond' => [
                                            'if' => ['$lte' => [['$abs' => '$$input'], Typing::$TIMESTAMP_RANGE]],
                                            'then' => [
                                                '$convert' => [
                                                    'input' => '$$input',
                                                    'to' => 'long',
                                                ],
                                            ],
                                            'else' => [
                                                '$dateFromString' => [
                                                    'dateString' => '$_this_is_missing',
                                                    'format' => [[
                                                        '$concat' => ['_throw_ toDate1'],
                                                    ]],
                                                ],
                                            ],
                                        ],
                                    ],
                                    'to' => 'date',
                                ],
                            ],
                        ], [
                            'case' => ['$eq' => [['$type' => '$$input'], 'string']],
                            'then' => [
                                '$cond' => [
                                    'if' => ['$regexMatch' => [
                                        'input' => '$$input',
                                        'regex' => Typing::ISO8601_PATTERN(),
                                    ]],
                                    'then' => [
                                        '$convert' => [
                                            'input' => '$$input',
                                            'to' => 'date',
                                        ],
                                    ],
                                    'else' => [
                                        '$dateFromString' => [
                                            'dateString' => '$_this_is_missing',
                                            'format' => [[
                                                '$concat' => ['_throw_ toDate1'],
                                            ]],
                                        ],
                                    ],
                                ],
                            ],
                        ]],
                        'default' => ['$toDate' => '$$input'],
                    ],
                ],
            ],
        ];
    }
}