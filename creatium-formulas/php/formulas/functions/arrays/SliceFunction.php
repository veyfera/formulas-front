<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class SliceFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 3;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);
        $start = $this->arguments[1]->evaluate($scope);

        if (Typing::isNull($input) || Typing::isNull($start)) {
            return null;
        } elseif (Typing::isArray($input)) {
            if (!Typing::isNumber($start)) {
                throw new Exception('slice3 :: ' . Typing::getType($start));
            }

            if (!Typing::isFinite($start) || Typing::hasFractionalPart($start)) {
                throw new Exception('fn3 :: slice,2nd');
            }

            if (count($this->arguments) > 2) {
                $count = $this->arguments[2]->evaluate($scope);

                if (Typing::isNull($count)) {
                    return null;
                } elseif (!Typing::isFinite($count) || Typing::hasFractionalPart($count)) {
                    throw new Exception('fn3 :: slice,3rd');
                } elseif ($count <= 0) {
                    throw new Exception('slice2 :: ' . $count);
                }
            } else {
                $count = null;
            }

            return array_slice($input, $start, $count);
        } else {
            throw new Exception('fn1 :: slice,' . Typing::getType($input));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        $input = $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options);
        $start = $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options);

        if (count($this->arguments) > 2) {
            $count = $this->arguments[2]->toMongoExpression($localVariables, $fieldNames, $options);
        } else {
            $count = Typing::$INT32_RANGE;
        }

        return [
            '$slice' => [$input, $start, $count],
        ];
    }
}