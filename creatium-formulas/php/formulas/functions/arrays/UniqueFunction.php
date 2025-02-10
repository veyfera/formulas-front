<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\Comparison;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class UniqueFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function optimize(): UniqueFunction
    {
        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($input)) {
            return null;
        } elseif (Typing::isArray($input)) {
            $result = [];

            foreach ($input as $elem) {
                $isUnique = true;
                foreach ($result as $resElem) {
                    if (Comparison::isEqual($elem, $resElem)) {
                        $isUnique = false;
                        break;
                    }
                }

                if ($isUnique) $result[] = $elem;
            }

            return $result;
        } else {
            throw new Exception('unique1 :: ' . Typing::getType($input));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
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
                            'then' => [
                                '$reduce' => [
                                    'input' => '$$input',
                                    'initialValue' => [],
                                    'in' => [
                                        '$cond' => [
                                            'if' => ['$eq' => [['$indexOfArray' => ['$$value', '$$this']], -1]],
                                            'then' => ['$concatArrays' => ['$$value', ['$$this']]],
                                            'else' => '$$value',
                                        ],
                                    ]
                                ],
                            ],
                        ]],
                        'default' => [
                            '$dateFromString' => [
                                'dateString' => '$_this_is_missing',
                                'format' => [[
                                    '$concat' => ['_throw_ unique1,', ['$type' => '$$input']],
                                ]],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}