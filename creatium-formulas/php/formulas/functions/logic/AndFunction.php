<?php

namespace formulas\functions\logic;

use formulas\Expression;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\OptimizedNode;

class AndFunction extends AbstractFunction
{
    static $binaryOperatorPrecedence = 2;

    protected int $minArguments = 2;
    protected int $maxArguments = 10;

    public function __construct(Expression $Expr, array $arguments)
    {
        parent::__construct($Expr, array_map(
            fn($arg) => [
                'type' => 'CallExpression',
                'arguments' => [$arg],
                'callee' => 'toBoolean',
            ],
            $arguments
        ));
    }

    public function optimize(): ExpressionNode
    {
        foreach ($this->arguments as $index => $argument) {
            $this->arguments[$index] = $argument->optimize();
        }

        foreach ($this->arguments as $index => $argument) {
            // Если любой из аргументов отрицательный на этапе оптимизации, его и возвращаем
            if ($argument instanceof OptimizedNode) {
                if (!$argument->result) {
                    $this->arguments = [$argument];
                    return new OptimizedNode($this);
                }
            }
        }

        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $shelve = [];

        // Сначала проверяем все аргументы, которые не используют переменные
        foreach ($this->arguments as $argument) {
            if ($argument instanceof OptimizedNode) {
                if (!$argument->result) return false;
            } else {
                $shelve[] = $argument;
            }
        }

        // Затем все, что осталось
        foreach ($shelve as $argument) {
            if (!$argument->evaluate($scope)) return false;
        }

        return true;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$and' => array_map(
                fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments
            )
        ];
    }
}