<?php

namespace formulas\functions\type;

use formulas\Expression;
use formulas\expressions\MemberExpression;
use formulas\functions\AbstractFunction;

class NullCoalescingFunction extends AbstractFunction
{
    static $binaryOperatorPrecedence = 11;
    static $rightAssociative = true;

    protected int $minArguments = 1;
    protected int $maxArguments = 2;

    public function __construct(Expression $Expr, array $arguments)
    {
        parent::__construct($Expr, $arguments);

        if ($this->arguments[0] instanceof MemberExpression) {
            $this->arguments[0]->disableNullSafety();
        }
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $left = $this->arguments[0]->evaluate($scope);

        if (count($this->arguments) > 1) {
            $right = $this->arguments[1]->evaluate($scope);
        } else {
            $right = null;
        }

        return $left ?? $right;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if (count($this->arguments) > 1) {
            $right = $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options);
        } else {
            $right = null;
        }

        return ['$ifNull' => [
            $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
            $right,
        ]];
    }
}