<?php

namespace formulas\functions\trigonometry;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class SinhFunction extends AbstractFunction
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
            throw new Exception("fn7 :: sinh," . Typing::getType($number));
        }

        return sinh($number);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$sinh' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
        ];
    }
}