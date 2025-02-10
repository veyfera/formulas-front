<?php

namespace formulas\functions\trigonometry;

use Exception;
use formulas\Convertation;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class AcosFunction extends AbstractFunction
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
            throw new Exception("fn7 :: acos," . Typing::getType($number));
        }

        if ($number < -1 || $number > 1) {
            throw new Exception("acos2 :: " . Convertation::toString($number));
        }

        return acos($number);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$acos' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
        ];
    }
}