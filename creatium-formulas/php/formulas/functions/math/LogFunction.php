<?php

namespace formulas\functions\math;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class LogFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $left = $this->arguments[0]->evaluate($scope);
        $right = $this->arguments[1]->evaluate($scope);

        if (Typing::isNull($left) || Typing::isNull($right)) {
            return null;
        }

        if (!Typing::isNumber($left)) {
            throw new Exception("fn2 :: log,1st," . Typing::getType($left));
        } elseif ($left <= 0) {
            throw new Exception("log3");
        }

        if (!Typing::isNumber($right)) {
            throw new Exception("fn2 :: log,2nd," . Typing::getType($right));
        } elseif ($right <= 0 || floatval($right) === 1.0) {
            throw new Exception("log4");
        }

        return log($left, $right);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$log' => array_map(
                fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments
            )
        ];
    }
}