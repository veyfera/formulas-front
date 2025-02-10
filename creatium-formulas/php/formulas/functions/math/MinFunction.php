<?php

namespace formulas\functions\math;

use Exception;
use formulas\Comparison;
use formulas\functions\AbstractFunction;
use formulas\Typing;
use formulas\ExpressionNode;
use formulas\expressions\ArrayExpression;

class MinFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function optimize(): ExpressionNode
    {
        if ($this->arguments[0] instanceof ArrayExpression) {
            return parent::optimize();
        } else {
            return $this;
        }
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($input)) {
            return null;
        } elseif (!Typing::isArray($input)) {
            throw new Exception('fn1 :: min,' . Typing::getType($input));
        }

        if (count($input) === 0) return null;

        $result = null;

        foreach ($input as $item) {
            if (Typing::isNull($item)) continue;

            if ($result === null || Comparison::isLess($item, $result)) {
                $result = $item;
            }
        }

        return $result;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if ($this->arguments[0] instanceof ArrayExpression) {
            return [
                '$min' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
            ];
        } else {
            return [
                '$let' => [
                    'vars' => [
                        'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                    ],
                    'in' => [
                        '$switch' => [
                            'branches' => [[
                                'case' => ['$eq' => ['$$input', null]],
                                'then' => null,
                            ], [
                                'case' => ['$isArray' => '$$input'],
                                'then' => ['$min' => '$$input'],
                            ]],
                            'default' => [
                                '$dateFromString' => [
                                    'dateString' => '$_this_is_missing',
                                    'format' => [[
                                        '$concat' => ['_throw_ fn1,min,', ['$type' => '$$input']],
                                    ]],
                                ],
                            ],
                        ],
                    ],
                ],
            ];
        }
    }
}