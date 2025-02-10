<?php

namespace formulas\functions\compare;

use formulas\Comparison;
use formulas\functions\AbstractFunction;

class GreaterFunction extends AbstractFunction
{
    static $binaryOperatorPrecedence = 7;

    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $left = $this->arguments[0]->evaluate($scope);
        $right = $this->arguments[1]->evaluate($scope);

        return Comparison::isGreater($left, $right);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$gt' => array_map(
                fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments
            )
        ];
    }
}