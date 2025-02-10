<?php

namespace formulas\functions\math;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class CeilFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $number = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($number)) {
            return null;
        }

        if (!Typing::isNumber($number)) {
            throw new Exception("fn7 :: ceil," . Typing::getType($number));
        }

        return ceil($number);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$ceil' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
        ];
    }
}