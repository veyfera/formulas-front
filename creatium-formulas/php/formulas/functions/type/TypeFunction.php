<?php

namespace formulas\functions\type;

use formulas\functions\AbstractFunction;
use formulas\Typing;
use formulas\ExpressionNode;

class TypeFunction extends AbstractFunction
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

        return Typing::getType($this->arguments[0]->evaluate($scope));
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
                            'case' => ['$eq' => ['$$input', null]],
                            'then' => 'null',
                        ], [
                            'case' => ['$isNumber' => '$$input'],
                            'then' => 'number',
                        ], [
                            'case' => ['$isArray' => '$$input'],
                            'then' => 'array',
                        ], [
                            'case' => ['$eq' => [['$type' => '$$input'], 'object']],
                            'then' => 'object',
                        ], [
                            'case' => ['$eq' => [['$type' => '$$input'], 'string']],
                            'then' => 'string',
                        ], [
                            'case' => ['$eq' => [['$type' => '$$input'], 'bool']],
                            'then' => 'boolean',
                        ], [
                            'case' => ['$eq' => [['$type' => '$$input'], 'date']],
                            'then' => 'date',
                        ]],
                    ],
                ],
            ],
        ];
    }
}