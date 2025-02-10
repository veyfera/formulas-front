<?php

namespace formulas\literals;

use Exception;
use formulas\Expression;
use formulas\Typing;
use formulas\ExpressionNode;
use formulas\OptimizedNode;

class NumberLiteral extends ExpressionNode
{
    /** @var int|float $value */
    private $value;

    public function __construct(Expression $Expr, $node)
    {
        parent::__construct($Expr);

        if (!isset($node['value'])) {
            throw new Exception('Number without value');
        }

        if ($node['value'] === 'NaN') {
            $this->value = NAN;
            return;
        }

        if ($node['value'] === 'Infinity') {
            $this->value = INF;
            return;
        }

        if (!Typing::isNumber($node['value'])) {
            throw new Exception('Number is not number');
        }

        $this->value = $node['value'];
    }

    public function optimize(): OptimizedNode
    {
        return new OptimizedNode($this);
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return floatval($this->value);
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