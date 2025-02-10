<?php

namespace formulas\functions\math;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class ModFunction extends AbstractFunction
{
    static $binaryOperatorPrecedence = 10;

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

        if (!Typing::isNumber($left) || !Typing::isNumber($right)) {
            throw new Exception("mod2 :: " . Typing::getType($left) . ',' . Typing::getType($right));
        }

        if (Typing::isZero($right)) {
            throw new Exception('mod1');
        }

        return fmod($left, $right);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$mod' => array_map(
                fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments
            )
        ];
    }
}