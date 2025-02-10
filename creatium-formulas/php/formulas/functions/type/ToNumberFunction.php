<?php

namespace formulas\functions\type;

use formulas\Convertation;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;

class ToNumberFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function optimize(): ExpressionNode
    {
        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return Convertation::toNumber($this->arguments[0]->evaluate($scope));
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$let' => [
                'vars' => [
                    'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options)
                ],
                'in' => [
                    '$cond' => [
                        'if' => ['$eq' => [['$type' => '$$input'], 'string']],
                        'then' => [
                            '$convert' => [
                                'input' => '$$input',
                                'to' => 'double',
                            ],
                        ],
                        'else' => [
                            '$convert' => [
                                'input' => '$$input',
                                'to' => 'double',
                                'onNull' => 0,
                            ],
                        ]
                    ]
                ],
            ],
        ];
    }
}