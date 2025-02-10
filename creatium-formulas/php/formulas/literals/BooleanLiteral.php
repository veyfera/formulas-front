<?php

namespace formulas\literals;

use Exception;
use formulas\Expression;
use formulas\Typing;
use formulas\ExpressionNode;
use formulas\OptimizedNode;

class BooleanLiteral extends ExpressionNode
{
    public bool $value;

    public function __construct(Expression $Expr, $node)
    {
        parent::__construct($Expr);

        if (!isset($node['value'])) {
            throw new Exception('Boolean without value');
        }

        if (!Typing::isBoolean($node['value'])) {
            throw new Exception('Boolean is not boolean');
        }

        $this->value = $node['value'];
    }

    public function optimize(): OptimizedNode
    {
        return new OptimizedNode($this);
    }

    public function evaluate($scope)
    {
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