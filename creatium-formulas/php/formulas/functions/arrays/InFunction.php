<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\Comparison;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class InFunction extends AbstractFunction
{
    static $binaryOperatorPrecedence = 7;

    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $element = $this->arguments[0]->evaluate($scope);
        $array = $this->arguments[1]->evaluate($scope);

        if (Typing::isArray($array)) {
            $result = false;

            foreach ($array as $item) {
                if (Comparison::isEqual($item, $element)) {
                    $result = true;
                    break;
                }
            }

            return $result;
        } else {
            throw new Exception('in1 :: ' . Typing::getType($array));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$in' => [
                $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}