<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\Convertation;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class FilterFunction extends AbstractFunction
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

                if (Convertation::toBoolean($this->arguments[1]->evaluate($childScope))) {
                    $result[] = $item;
                }
            }

            return $result;
        } else {
            throw new Exception('fn1 :: filter,' . Typing::getType($input));
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
            '$filter' => [
                'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                'as' => 'item',
                'cond' => $this->arguments[1]->toMongoExpression($nestedLocalVariables, $fieldNames, $options),
            ],
        ];
    }
}