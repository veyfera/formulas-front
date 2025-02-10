<?php

namespace formulas\functions\text;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class LengthFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        if (Typing::isString($input)) {
            return mb_strlen($input);
        } else {
            throw new Exception('fn6 :: length,' . Typing::getType($input));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$strLenCP' => [
                $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}