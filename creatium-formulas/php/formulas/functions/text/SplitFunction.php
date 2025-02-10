<?php

namespace formulas\functions\text;

use Exception;
use formulas\Convertation;
use formulas\Expression;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class SplitFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);
        $delimiter = $this->arguments[1]->evaluate($scope);

        if (Typing::isNull($input) || Typing::isNull($delimiter)) {
            return null;
        }

        if (!Typing::isString($input)) {
            throw new Exception('fn5 :: split,1st,' . Typing::getType($input));
        }

        if (!Typing::isString($delimiter)) {
            throw new Exception('fn5 :: split,2nd,' . Typing::getType($delimiter));
        }

        if ($delimiter === '') {
            throw new Exception('split3');
        }

        return explode($delimiter, $input);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$split' => [
                $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}