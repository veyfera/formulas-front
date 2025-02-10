<?php

namespace formulas\functions\type;

use formulas\Expression;
use formulas\ExpressionNode;
use formulas\expressions\ArrayExpression;
use formulas\expressions\MemberExpression;
use formulas\expressions\ObjectExpression;
use formulas\functions\AbstractFunction;
use formulas\Identifier;
use formulas\literals\BooleanLiteral;
use formulas\literals\DateLiteral;
use formulas\literals\NumberLiteral;
use formulas\literals\StringLiteral;
use formulas\literals\NullLiteral;
use formulas\OptimizedNode;

class ExistsFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function __construct(Expression $Expr, array $arguments)
    {
        parent::__construct($Expr, $arguments);

        if (!(
            $this->arguments[0] instanceof BooleanLiteral ||
            $this->arguments[0] instanceof StringLiteral ||
            $this->arguments[0] instanceof NumberLiteral ||
            $this->arguments[0] instanceof NullLiteral ||
            $this->arguments[0] instanceof DateLiteral ||
            $this->arguments[0] instanceof ArrayExpression ||
            $this->arguments[0] instanceof ObjectExpression ||
            $this->arguments[0] instanceof MemberExpression ||
            $this->arguments[0] instanceof Identifier
        )) {
            throw new \Exception('exists1');
        }

        if ($this->arguments[0] instanceof MemberExpression || $this->arguments[0] instanceof Identifier) {
            $this->arguments[0]->enableExistsMode();
        }
    }

    public function optimize(): ExistsFunction
    {
        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        if (
            $this->arguments[0] instanceof BooleanLiteral ||
            $this->arguments[0] instanceof StringLiteral ||
            $this->arguments[0] instanceof NumberLiteral ||
            $this->arguments[0] instanceof NullLiteral ||
            $this->arguments[0] instanceof DateLiteral ||
            $this->arguments[0] instanceof ArrayExpression ||
            $this->arguments[0] instanceof ObjectExpression
        ) {
            return true;
        }

        if ($this->arguments[0] instanceof OptimizedNode) {
            return true;
        }

        if ($this->arguments[0] instanceof MemberExpression || $this->arguments[0] instanceof Identifier) {
            return $this->arguments[0]->evaluateExists($scope);
        }

        return false;
    }

    public function preEvaluate(array $localVariables, object $scope): ExpressionNode
    {
        try {
            if ($this->arguments[0] instanceof Identifier) {
                $result = $this->arguments[0]->evaluateExists($scope);
                return new OptimizedNode(new BooleanLiteral($this->Expr, ['type' => 'Boolean', 'value' => $result]));
            }

            return parent::preEvaluate($localVariables, $scope);
        } catch (\Throwable $e) {
            if ($e->getMessage() === 'undefined') {
                return new OptimizedNode(new BooleanLiteral($this->Expr, ['type' => 'Boolean', 'value' => false]));
            }

            throw $e;
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return ['$ne' => [
            ['$type' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options)],
            'missing'
        ]];
    }
}