<?php

namespace formulas\expressions;

use Exception;
use formulas\Expression;
use formulas\ExpressionNode;
use formulas\OptimizedNode;
use formulas\Typing;

class ArrayExpression extends ExpressionNode
{
    /** @var ExpressionNode[] $array */
    public array $array;

    public function __construct(Expression $Expr, $node)
    {
        parent::__construct($Expr);

        if (!isset($node['elements'])) {
            throw new Exception('Array without elements');
        }

        $this->array = [];

        foreach ($node['elements'] as $element) {
            $this->array[] = $this->Expr->makeNode($element);
        }
    }

    public function optimize(): ExpressionNode
    {
        $canBeOptimized = true;

        foreach ($this->array as $key => $node) {
            $this->array[$key] = $node->optimize();

            if (!$this->array[$key] instanceof OptimizedNode) {
                $canBeOptimized = false;
            }
        }

        if ($canBeOptimized) {
            return new OptimizedNode($this);
        }

        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $result = [];

        foreach ($this->array as $node) {
            $result[] = $node->evaluate($scope);
        }

        return $result;
    }

    public function gatherExternalIdentifiers()
    {
        $list = [];

        foreach ($this->array as $node) {
            $list = array_merge($list, $node->gatherExternalIdentifiers());
        }

        return $list;
    }

    public function preEvaluate(array $localVariables, object $scope): ExpressionNode
    {
        $canBeOptimized = true;

        foreach ($this->array as $key => $node) {
            $this->array[$key] = $node->preEvaluate($localVariables, $scope);

            if (!$this->array[$key] instanceof OptimizedNode) {
                $canBeOptimized = false;
            }
        }

        if ($canBeOptimized) {
            return new OptimizedNode($this, $scope);
        }

        return $this;
    }

    public function toCode(): string
    {
        return implode([
            '[',
            implode(', ', array_map(
                fn($el) => $el->toCode(),
                $this->array
            )),
            ']',
        ]);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        $result = [];

        foreach ($this->array as $node) {
            $result[] = $node->toMongoExpression($localVariables, $fieldNames, $options);
        }

        return $result;
    }
}