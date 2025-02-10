<?php

namespace formulas;

use stdClass;

class OptimizedNode extends ExpressionNode
{
    public $source;
    public $result;

    public function __construct($node, object $scope = null)
    {
        parent::__construct($node->Expr);

        $this->source = $node;
        $this->result = $node->evaluate($scope ?? new stdClass());
    }

    public function optimize(): OptimizedNode
    {
        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return $this->result;
    }

    public function gatherExternalIdentifiers()
    {
        return [];
    }

    public function preEvaluate(array $localVariables, object $scope): OptimizedNode
    {
        return $this;
    }

    public function toCode(): string
    {
        return Expression::prettyPrint($this->result, false);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$literal' => $this->result
        ];
    }
}