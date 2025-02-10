<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class RangeFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 3;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $start = $this->arguments[0]->evaluate($scope);
        $end = $this->arguments[1]->evaluate($scope);

        $step = 1;
        if (count($this->arguments) > 2) {
            $step = $this->arguments[2]->evaluate($scope);
        }

        if (!Typing::isNumber($start)) {
            throw new Exception("fn2 :: range,1st," . Typing::getType($start));
        }

        if (!Typing::is32BitInteger($start)) {
            throw new Exception('fn3 :: range,1st');
        }

        if (!Typing::isNumber($end)) {
            throw new Exception("fn2 :: range,2nd," . Typing::getType($end));
        }

        if (!Typing::is32BitInteger($end)) {
            throw new Exception('fn3 :: range,2nd');
        }

        if (!Typing::isNumber($step)) {
            throw new Exception("fn2 :: range,3rd," . Typing::getType($step));
        }

        if (!Typing::is32BitInteger($step)) {
            throw new Exception('fn3 :: range,3rd');
        }

        if ($step == 0) {
            throw new Exception('range7');
        }

        $length = max(ceil(($end - $start) / $step), 0);
        $range = array_fill(0, $length, 0);

        for ($idx = 0; $idx < $length; $idx++, $start += $step) {
            $range[$idx] = $start;
        }

        return $range;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$range' => array_map(
                fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments
            )
        ];
    }
}