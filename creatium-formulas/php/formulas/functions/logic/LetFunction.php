<?php

namespace formulas\functions\logic;

use Exception;
use formulas\ExpressionNode;
use formulas\expressions\ObjectExpression;
use formulas\functions\AbstractFunction;
use formulas\OptimizedNode;

class LetFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    static function assertId($key, $return = false)
    {
        preg_match('/^[a-z]+[a-zA-Z0-9_]*$/', $key, $match);
        if (!count($match)) {
            if ($return) return false;
            throw new Exception('let2 :: ' . $key);
        }

        return true;
    }

    public function optimize(): ExpressionNode
    {
        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        if (!$this->arguments[0] instanceof ObjectExpression) {
            throw new Exception('let1');
        }

        $childScope = clone $scope;

        foreach ($this->arguments[0]->object as $key => $variable) {
            self::assertId($key);
            $childScope->$key = $variable->evaluate($childScope);
        }

        return $this->arguments[1]->evaluate($childScope);
    }

    public function gatherExternalIdentifiers()
    {
        $localVariables = [];
        $list = [];

        foreach ($this->arguments[0]->object as $key => $value) {
            self::assertId($key);

            $list = array_merge(
                $list,
                array_diff($value->gatherExternalIdentifiers(), $localVariables)
            );

            $localVariables[] = $key;
        }

        $list = array_merge(
            $list,
            array_diff($this->arguments[1]->gatherExternalIdentifiers(), $localVariables)
        );

        return $list;
    }

    public function preEvaluate(array $localVariables, object $scope): ExpressionNode
    {
        $nestedLocalVariables = $localVariables;
        $canBeOptimized = true;

        foreach ($this->arguments[0]->object as $key => $value) {
            self::assertId($key);
            $this->arguments[0]->object->$key = $value->preEvaluate($nestedLocalVariables, $scope);

            if ($this->arguments[0]->object->$key instanceof OptimizedNode) {
                // Если переменная раскрывается, то добавляем ее в скоуп
                $scope->$key = $this->arguments[0]->object->$key->evaluate($scope);
            } else {
                // Иначе она попадает в список локальных переменных и не меняется больше
                $canBeOptimized = false;
                $nestedLocalVariables[] = $key;
            }
        }

        $this->arguments[1] = $this->arguments[1]->preEvaluate($nestedLocalVariables, $scope);
        if (!$this->arguments[1] instanceof OptimizedNode) {
            $canBeOptimized = false;
        }

        if ($canBeOptimized) {
            return new OptimizedNode($this, $scope);
        } else {
            if (count($this->gatherExternalIdentifiers()) === 0) {
                return new OptimizedNode($this, $scope);
            } else {
                return $this;
            }
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if (!$this->arguments[0] instanceof ObjectExpression) {
            return [
                '$dateFromString' => [
                    'dateString' => '$_this_is_missing',
                    'format' => ['_throw_ let1'],
                ],
            ];
        }

        $nestedLocalVariables = $localVariables;
        $chain = [];
        foreach ($this->arguments[0]->object as $key => $variable) {
            if (!self::assertId($key, true)) {
                return [
                    '$dateFromString' => [
                        'dateString' => '$_this_is_missing',
                        'format' => ['_throw_ let2,' . $key],
                    ],
                ];
            }

            $chain[$key] = $variable->toMongoExpression($nestedLocalVariables, $fieldNames, $options);
            $nestedLocalVariables[$key] = $key;
        }

        $result = $this->arguments[1]->toMongoExpression($nestedLocalVariables, $fieldNames, $options);

        foreach (array_reverse($chain) as $key => $variable) {
            $result = [
                '$let' => [
                    'vars' => [$key => $variable],
                    'in' => $result,
                ],
            ];
        }

        return $result;
    }
}