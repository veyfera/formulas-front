<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class ReverseFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($input)) {
            return null;
        } elseif (Typing::isArray($input)) {
            return array_reverse($input);
        } else {
            throw new Exception('fn1 :: reverse,' . Typing::getType($input));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$reverseArray' => [
                $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}