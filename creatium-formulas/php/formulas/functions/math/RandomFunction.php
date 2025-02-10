<?php

namespace formulas\functions\math;

use formulas\functions\AbstractFunction;

class RandomFunction extends AbstractFunction
{
    protected int $minArguments = 0;
    protected int $maxArguments = 0;

    public function optimize(): RandomFunction
    {
        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return (float) rand() / (float) getrandmax();
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return ['$rand' => []];
    }
}