<?php

namespace formulas\literals;

use formulas\Expression;
use formulas\ExpressionNode;
use formulas\OptimizedNode;

class NullLiteral extends ExpressionNode
{
    public $value;

    public function __construct(Expression $Expr, $node)
    {
        parent::__construct($Expr);

        $this->value = null;
    }

    public function optimize(): OptimizedNode
    {
        return new OptimizedNode($this);
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return $this->value;
    }

    public function gatherExternalIdentifiers()
    {
        return [];
    }

    public function preEvaluate(array $localVariables, object $scope): OptimizedNode
    {
        return new OptimizedNode($this, $scope);
    }

    public function toCode(): string
    {
        return Expression::prettyPrint($this->value);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return $this->value;
    }
}