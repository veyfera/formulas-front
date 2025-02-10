<?php

namespace formulas\functions\logic;

use formulas\Expression;
use formulas\functions\AbstractFunction;

class NotFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function __construct(Expression $Expr, array $arguments)
    {
        parent::__construct($Expr, [[
            'type' => 'CallExpression',
            'arguments' => $arguments,
            'callee' => 'toBoolean',
        ]]);
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return !$this->arguments[0]->evaluate($scope);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$not' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
        ];
    }
}