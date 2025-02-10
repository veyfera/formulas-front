<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class ReduceFunction extends AbstractFunction
{
    protected int $minArguments = 3;
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

        if (Typing::isNull($input)) {
            return null;
        } elseif (Typing::isArray($input)) {
            $result = $this->arguments[2]->evaluate($scope);

            foreach ($input as $item) {
                $childScope = clone $scope;
                $childScope->item = $item;
                $childScope->value = $result;

                $result = $this->arguments[1]->evaluate($childScope);
            }

            return $result;
        } else {
            throw new Exception('fn1 :: reduce,' . Typing::getType($input));
        }
    }

    public function localVariableList()
    {
        return ['value', 'item'];
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        $nestedLocalVariables = $localVariables;
        $nestedLocalVariables['value'] = 'value';
        $nestedLocalVariables['item'] = 'this';

        return [
            '$reduce' => [
                'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                'in' => $this->arguments[1]->toMongoExpression($nestedLocalVariables, $fieldNames, $options),
                'initialValue' => $this->arguments[2]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}