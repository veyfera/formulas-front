<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\Comparison;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class IndexOfFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $array = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($array)) {
            return null;
        }

        $element = $this->arguments[1]->evaluate($scope);

        if (Typing::isArray($array)) {
            $result = -1;

            foreach ($array as $index => $item) {
                if (Comparison::isEqual($item, $element)) {
                    $result = $index;
                    break;
                }
            }

            return $result;
        } else {
            throw new Exception('indexOf1 :: ' . Typing::getType($array));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$indexOfArray' => [
                $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}