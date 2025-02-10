<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class CountFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        if (Typing::isArray($input)) {
            return count($input);
        } else {
            throw new Exception('fn1 :: count,' . Typing::getType($input));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$size' => [
                $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}