<?php

namespace formulas;

abstract class ExpressionNode
{
    var Expression $Expr;

    public function __construct(Expression $Expr)
    {
        $this->Expr = $Expr;
    }

    abstract function optimize(): ExpressionNode;

    abstract function evaluate(object $scope);

    abstract function gatherExternalIdentifiers();

    abstract function preEvaluate(array $localVariables, object $scope);

    abstract function toCode(): string;

    abstract function toMongoExpression(array $localVariables, array $fieldNames, array $options);
}