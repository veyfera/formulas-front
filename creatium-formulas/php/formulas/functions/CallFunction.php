<?php

namespace formulas\functions;

use Exception;

class CallFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $name = $this->arguments[0]->evaluate($scope);
        $arguments = $this->arguments[1]->evaluate($scope);

        // TODO
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        throw new Exception('general2 :: call');
    }
}