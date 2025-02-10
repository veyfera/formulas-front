<?php

namespace formulas\functions\compare;

use formulas\Comparison;
use formulas\functions\AbstractFunction;

class NotEqualFunction extends AbstractFunction
{
    static $binaryOperatorPrecedence = 6;

    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $left = $this->arguments[0]->evaluate($scope);
        $right = $this->arguments[1]->evaluate($scope);

        return !Comparison::isEqual($left, $right);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$ne' => array_map(
                fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments
            )
        ];
    }
}