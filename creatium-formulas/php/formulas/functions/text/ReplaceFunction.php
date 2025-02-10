<?php

namespace formulas\functions\text;

use Exception;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class ReplaceFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 3;

    public function optimize(): ExpressionNode
    {
        foreach ($this->arguments as $index => $argument) {
            $this->arguments[$index] = $argument->optimize();
        }

        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);
        $find = $this->arguments[1]->evaluate($scope);
        $replacement = $this->arguments[2]->evaluate($scope);

        if (!Typing::isNull($input) && !Typing::isString($input)) {
            throw new Exception('fn5 :: replace,1st,' . Typing::getType($input));
        }

        if (!Typing::isNull($find) && !Typing::isString($find)) {
            throw new Exception('fn5 :: replace,2nd,' . Typing::getType($find));
        }

        if (!Typing::isNull($replacement) && !Typing::isString($replacement)) {
            throw new Exception('fn5 :: replace,3rd,' . Typing::getType($replacement));
        }

        if (Typing::isNull($input) || Typing::isNull($find) || Typing::isNull($replacement)) {
            return null;
        }

        $pos = strpos($input, $find);
        if ($pos === false) return $input;
        else {
            return substr_replace($input, $replacement, $pos, strlen($find));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$replaceOne' => [
                'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                'find' => $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                'replacement' => $this->arguments[2]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}