<?php

namespace formulas\functions\trigonometry;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class Atan2Function extends AbstractFunction
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
            throw new Exception("fn7 :: atan2," . Typing::getType($left));
        }

        if (!Typing::isNumber($right)) {
            throw new Exception("fn7 :: atan2," . Typing::getType($right));
        }

        return atan2($left, $right);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$atan2' => array_map(
                fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments
            )
        ];
    }
}