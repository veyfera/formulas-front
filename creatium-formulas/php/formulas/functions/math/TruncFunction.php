<?php

namespace formulas\functions\math;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class TruncFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $number = $this->arguments[0]->evaluate($scope);

        $precision = 0;
        if (count($this->arguments) > 1) {
            $precision = $this->arguments[1]->evaluate($scope);
        }

        if (Typing::isNull($number) || Typing::isNull($precision)) {
            return null;
        }

        if (!Typing::isNumber($number)) {
            throw new Exception("fn7 :: trunc," . Typing::getType($number));
        }

        if (!Typing::isNumber($precision)) {
            throw new Exception("convert3 :: " . Typing::getType($precision) . ",number");
        }

        if ($precision < -20 || $precision > 100) {
            throw new Exception("trunc2 :: " . $precision);
        }

        $mult = pow(10, $precision);
        if ($number > 0) {
            return Typing::fixNegativeZero(floor($number * $mult) / $mult);
        } else {
            return Typing::fixNegativeZero(ceil($number * $mult) / $mult);
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        // Прибавляем 0, чтобы привратить -0 в 0, который может получиться при округлении -0.5
        return [
            '$add' => [[
                '$trunc' => array_map(
                    fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                    $this->arguments
                )
            ], 0],
        ];
    }
}