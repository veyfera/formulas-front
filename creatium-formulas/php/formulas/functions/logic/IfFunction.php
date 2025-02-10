<?php

namespace formulas\functions\logic;

use Exception;
use formulas\Expression;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\OptimizedNode;

class IfFunction extends AbstractFunction
{
    protected int $minArguments = 3;
    protected int $maxArguments = 101;

    public function __construct(Expression $Expr, array $arguments)
    {
        if ((count($arguments) - 1) % 2 > 0) {
            throw new Exception('Wrong argument count');
        }

        for ($i = 0; $i < (count($arguments) - 1); $i += 2) {
            $arguments[$i] = [
                'type' => 'CallExpression',
                'arguments' => [$arguments[$i]],
                'callee' => 'toBoolean',
            ];
        }

        parent::__construct($Expr, $arguments);
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        for ($i = 0; $i < (count($this->arguments) - 1); $i += 2) {
            if ($this->arguments[$i]->evaluate($scope)) {
                return $this->arguments[$i + 1]->evaluate($scope);
            }
        }

        return $this->arguments[$i]->evaluate($scope);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if (count($this->arguments) === 3) {
            return [
                '$cond' => [
                    'if' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                    'then' => $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                    'else' => $this->arguments[2]->toMongoExpression($localVariables, $fieldNames, $options),
                ]
            ];
        } else {
            $branches = [];

            for ($i = 0; $i < (count($this->arguments) - 1); $i += 2) {
                $branches[] = [
                    'case' => $this->arguments[$i]->toMongoExpression($localVariables, $fieldNames, $options),
                    'then' => $this->arguments[$i + 1]->toMongoExpression($localVariables, $fieldNames, $options),
                ];
            }

            return [
                '$switch' => [
                    'branches' => $branches,
                    'default' => $this->arguments[$i]->toMongoExpression($localVariables, $fieldNames, $options)
                ],
            ];
        }
    }
}