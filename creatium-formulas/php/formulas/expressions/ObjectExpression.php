<?php

namespace formulas\expressions;

use Exception;
use formulas\Typing;
use stdClass;
use formulas\Expression;
use formulas\ExpressionNode;
use formulas\OptimizedNode;

class ObjectExpression extends ExpressionNode
{
    public object $object;

    public function __construct(Expression $Expr, $node)
    {
        parent::__construct($Expr);

        if (!isset($node['properties'])) {
            throw new Exception('Object without properties');
        }

        $this->object = new stdClass();

        foreach ($node['properties'] as $property) {
            if (!isset($property['key'])) {
                throw new Exception('Object property without key');
            }

            if (!is_string($property['key'])) {
                throw new Exception('Object property key is not string');
            }

            if (!isset($property['value'])) {
                throw new Exception('Object property without value');
            }

            $key = strval($property['key']);

            $this->object->$key = $this->Expr->makeNode($property['value']);
        }
    }

    public function optimize(): ExpressionNode
    {
        $canBeOptimized = true;

        foreach ($this->object as $key => $value) {
            $this->object->$key = $value->optimize();

            if (!$this->object->$key instanceof OptimizedNode) {
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

        $result = new stdClass();

        foreach ($this->object as $key => $value) {
            $result->$key = $value->evaluate($scope);
        }

        return $result;
    }

    public function gatherExternalIdentifiers()
    {
        $list = [];

        foreach ($this->object as $value) {
            $list = array_merge($list, $value->gatherExternalIdentifiers());
        }

        return $list;
    }

    public function preEvaluate(array $localVariables, object $scope): ExpressionNode
    {
        $canBeOptimized = true;

        foreach ($this->object as $key => $value) {
            $this->object->$key = $value->preEvaluate($localVariables, $scope);

            if (!$this->object->$key instanceof OptimizedNode) {
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
            '{',
            implode(', ', array_map(
                fn($key) => Expression::prettyPrint($key) . ': ' . $this->object->$key->toCode(),
                array_keys((array) $this->object)
            )),
            '}',
        ]);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        $result = new stdClass();
        $setFields = [];

        foreach ($this->object as $key => $value) {
            if ($key[0] === '$' || strpos($key, '.') !== false) {
                $setFields[$key] = $value->toMongoExpression($localVariables, $fieldNames, $options);
            } else {
                $result->$key = $value->toMongoExpression($localVariables, $fieldNames, $options);
            }
        }

        foreach ($setFields as $key => $value) {
            $result = [
                '$setField' => [
                    'field' => ['$literal' => $key],
                    'input' => $result,
                    'value' => $value,
                ],
            ];
        }

        return $result;
    }
}