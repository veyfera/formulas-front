<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class MapFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 2;

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

        if (Typing::isNull($input)) {
            return null;
        } elseif (Typing::isArray($input)) {
            $result = [];

            foreach ($input as $item) {
                $childScope = clone $scope;
                $childScope->item = $item;
                $result[] = $this->arguments[1]->evaluate($childScope);
            }

            return $result;
        } else {
            throw new Exception('fn1 :: map,' . Typing::getType($input));
        }
    }

    public function localVariableList()
    {
        return ['item'];
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        $nestedLocalVariables = $localVariables;
        $nestedLocalVariables['item'] = 'item';

        return [
            '$map' => [
                'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                'as' => 'item',
                'in' => $this->arguments[1]->toMongoExpression($nestedLocalVariables, $fieldNames, $options),
            ],
        ];
    }
}