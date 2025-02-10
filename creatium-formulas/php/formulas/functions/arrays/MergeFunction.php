<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class MergeFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 20;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $result = [];

        foreach ($this->arguments as $argument) {
            $operand = $argument->evaluate($scope);

            if (Typing::isNull($operand)) {
                return null;
            } elseif (Typing::isArray($operand)) {
                $result = array_merge($result, $operand);
            } else {
                throw new Exception('fn1 :: merge,' . Typing::getType($operand));
            }
        }

        return $result;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$concatArrays' => array_map(
                fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments
            ),
        ];
    }
}