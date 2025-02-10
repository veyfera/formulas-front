<?php

namespace formulas;

use Exception;

class Identifier extends ExpressionNode
{
    public string $name;
    public bool $column;

    public bool $existsMode = false;

    public function __construct(Expression $Expr, $node)
    {
        parent::__construct($Expr);

        if (!isset($node['name'])) {
            throw new Exception('Identifier without name');
        }

        if (!Typing::isString($node['name'])) {
            throw new Exception('Name is not string');
        }

        if (!isset($node['column'])) {
            // Этого поля не было изначально
            $this->column = false;
        } else {
            $this->column = boolval($node['column']);
        }

        $this->name = strval($node['name']);
    }

    public function enableExistsMode()
    {
        $this->existsMode = true;
    }

    public function optimize(): Identifier
    {
        return $this;
    }

    private function _evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        if ($this->column) {
            throw new Exception('Column execution is not supported here');
        }

        return property_exists($scope, $this->name) || isset($scope->{$this->name});
    }

    public function evaluate($scope)
    {
        if ($this->_evaluate($scope)) {
            return $scope->{$this->name};
        } else {
            if ($this->existsMode) {
                return null;
            } else {
                throw new Exception("var1 :: " . $this->name);
            }
        }
    }

    public function evaluateExists($scope)
    {
        return $this->_evaluate($scope);
    }

    public function gatherExternalIdentifiers()
    {
        if ($this->column) {
            // Возвращаем идентификатор с @, чтобы он точно не оптимизировался
            return ['@' . $this->name];
        } else {
            return [$this->name];
        }
    }

    public function preEvaluate(array $localVariables, object $scope): ExpressionNode
    {
        if ($this->column || in_array($this->name, $localVariables)) {
            return $this;
        } else {
            return new OptimizedNode($this, $scope);
        }
    }

    public function toCode(): string
    {
        return $this->column ? '@' . $this->name : $this->name;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if ($this->existsMode !== true) {
            if ($this->column) {
                if (!in_array($this->name, $fieldNames)) {
                    throw new Exception("var1 :: " . $this->name);
                }
            } else {
                if (!in_array($this->name, array_keys($localVariables))) {
                    if ($options['testing'] === true) {
                        // В режиме тестирования мы обычные идентификаторы используем вместо column
                        if (!in_array($this->name, $fieldNames)) {
                            throw new Exception("var1 :: " . $this->name);
                        }
                    } else {
                        throw new Exception("var1 :: " . $this->name);
                    }
                }
            }
        }

        if (substr($this->name, 0, 1) === '$' || strpos($this->name, '.') !== false) {
            return [
                '$getField' => [
                    '$literal' => $this->name
                ]
            ];
        } else {
            if (isset($localVariables[$this->name])) {
                return '$$' . $localVariables[$this->name];
            } else {
                if (isset($options['watchFullDocumentMode']) && $options['watchFullDocumentMode'] === true) {
                    return '$fullDocument.' . $this->name;
                } else {
                    return '$' . $this->name;
                }
            }
        }
    }
}