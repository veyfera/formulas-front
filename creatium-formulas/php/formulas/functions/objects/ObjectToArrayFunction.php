<?php

namespace formulas\functions\objects;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class ObjectToArrayFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($input)) {
            return null;
        }

        if (Typing::isObject($input)) {
            $result = [];

            foreach ($input as $key => $value) {
                $result[] = (object) ['k' => $key, 'v' => $value];
            }

            return $result;
        } else {
            throw new Exception('objectToArray1 :: ' . Typing::getType($input));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$objectToArray' => [
                $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}