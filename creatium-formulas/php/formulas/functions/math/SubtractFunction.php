<?php

namespace formulas\functions\math;

use Exception;
use formulas\Convertation;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class SubtractFunction extends AbstractFunction
{
    static $binaryOperatorPrecedence = 9;

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

        if (Typing::isDate($left) && Typing::isNumber($right)) {
            return Convertation::toDate(Convertation::toNumber($left) - $right);
        }

        if (!Typing::isNumber($left) || !Typing::isNumber($right)) {
            throw new Exception("subtract1 :: " . Typing::getType($right) . ',' . Typing::getType($left));
        }

        return $left - $right;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$subtract' => array_map(fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options), $this->arguments)
        ];
    }
}