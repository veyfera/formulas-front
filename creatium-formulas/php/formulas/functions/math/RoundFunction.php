<?php

namespace formulas\functions\math;

use Exception;
use formulas\Convertation;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class RoundFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 2;

    private function roundHalfToEven($number, $precision)
    {
        return round($number, $precision, PHP_ROUND_HALF_EVEN);
    }

    private function roundHalfTowardZero($number, $precision)
    {
        if ($number > 0) {
            return round($number, $precision, PHP_ROUND_HALF_DOWN);
        } else {
            return -round(-$number, $precision, PHP_ROUND_HALF_DOWN);
        }
    }

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
            throw new Exception("fn7 :: round," . Typing::getType($number));
        }

        if (!Typing::isNumber($precision)) {
            throw new Exception("convert3 :: " . Typing::getType($precision) . ",number");
        }

        if (!Typing::isFinite($precision)) {
            throw new Exception("general1");
        }

        if (Typing::hasFractionalPart($precision)) {
            throw new Exception("round3");
        }

        if ($precision < -20 || $precision > 100) {
            throw new Exception("round2 :: " . Convertation::toString($precision));
        }

        if ($precision > 0) {
            return Typing::fixNegativeZero($this->roundHalfTowardZero($number, $precision));
        } else {
            return Typing::fixNegativeZero($this->roundHalfToEven($number, $precision));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        // Прибавляем 0, чтобы привратить -0 в 0, который может получиться при округлении -0.5
        return [
            '$add' => [[
                '$round' => array_map(
                    fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                    $this->arguments
                )
            ], 0],
        ];
    }
}