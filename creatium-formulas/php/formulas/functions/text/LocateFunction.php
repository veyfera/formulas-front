<?php

namespace formulas\functions\text;

use Exception;
use formulas\Convertation;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class LocateFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 3;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);
        $needle = $this->arguments[1]->evaluate($scope);

        if (Typing::isNull($input)) {
            return null;
        } elseif (!Typing::isString($input)) {
            throw new Exception('fn5 :: locate,1st,' . Typing::getType($input));
        }

        if (!Typing::isString($needle)) {
            throw new Exception('fn5 :: locate,2nd,' . Typing::getType($needle));
        }

        $start = 0;
        if (count($this->arguments) > 2) {
            $start = $this->arguments[2]->evaluate($scope);
        }

        $result = mb_strpos($input, $needle, $start);
        if ($result === false) $result = -1;

        return $result;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if (count($this->arguments) > 2) {
            $start = $this->arguments[2]->toMongoExpression($localVariables, $fieldNames, $options);
        } else {
            $start = 0;
        }

        return [
            '$indexOfCP' => [
                $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                $start,
            ],
        ];
    }
}