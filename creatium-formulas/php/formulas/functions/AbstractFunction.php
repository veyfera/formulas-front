<?php

namespace formulas\functions;

use Exception;
use formulas\Expression;
use formulas\ExpressionNode;
use formulas\OptimizedNode;
use formulas\Typing;

abstract class AbstractFunction extends ExpressionNode
{
    protected int $minArguments = 0;
    protected int $maxArguments = 0;

    /** @var ExpressionNode[] $arguments */
    public array $arguments = [];

    public function __construct(Expression $Expr, array $arguments)
    {
        parent::__construct($Expr);

        if (count($arguments) > $this->maxArguments) {
            throw new Exception('Too much arguments');
        } elseif (count($arguments) < $this->minArguments) {
            throw new Exception('Not enough arguments');
        }

        foreach ($arguments as $argument) {
            $this->arguments[] = $this->Expr->makeNode($argument);
        }
    }

    public function optimize(): ExpressionNode
    {
        $canBeOptimized = true;

        foreach ($this->arguments as $index => $argument) {
            $this->arguments[$index] = $argument->optimize();

            if (!$this->arguments[$index] instanceof OptimizedNode) {
                $canBeOptimized = false;
            }
        }

        if ($canBeOptimized) {
            return new OptimizedNode($this);
        } else {
            return $this;
        }
    }

    public function localVariableList()
    {
        return [];
    }

    public function gatherExternalIdentifiers()
    {
        $list = [];

        foreach ($this->arguments as $argument) {
            $list = array_merge($list, $argument->gatherExternalIdentifiers());
        }

        $list = array_diff($list, $this->localVariableList());

        return $list;
    }

    public function preEvaluate(array $localVariables, object $scope): ExpressionNode
    {
        $nestedLocalVariables = array_merge($localVariables, $this->localVariableList());

        $canBeOptimized = true;

        foreach ($this->arguments as $index => $argument) {
            $this->arguments[$index] = $argument->preEvaluate($nestedLocalVariables, $scope);

            if (!$this->arguments[$index] instanceof OptimizedNode) {
                $canBeOptimized = false;
            }
        }

        if ($canBeOptimized) {
            return new OptimizedNode($this, $scope);
        } else {
            if (count($this->gatherExternalIdentifiers()) === 0) {
                return new OptimizedNode($this, $scope);
            } else {
                return $this;
            }
        }
    }

    public function toCode(): string
    {
        foreach (Expression::$FUNCTIONS as $name => $class) {
            if ($this instanceof $class) {
                $fnName = $name;
                break;
            }
        }

        if (isset($fnName)) {
            return implode([
                $fnName,
                '(',
                implode(', ', array_map(
                    fn($el) => $el->toCode(),
                    $this->arguments
                )),
                ')',
            ]);
        }

        foreach (Expression::$BINARY_OPERATORS as $name => $class) {
            if ($this instanceof $class) {
                $opName = $name;
                break;
            }
        }

        if (isset($opName)) {
            return implode([
                '(',
                $this->arguments[0]->toCode(),
                ' ' . $opName . ' ',
                $this->arguments[1]->toCode(),
                ')',
            ]);
        }

        throw new Exception('Unknown function');
    }
}