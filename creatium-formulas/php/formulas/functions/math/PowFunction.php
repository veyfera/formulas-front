<?php

namespace formulas\functions\math;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class PowFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $left = $this->arguments[0]->evaluate($scope);
        $right = $this->arguments[1]->evaluate($scope);

        if (Typing::isNull($left) || Typing::isNull($right)) {
            return null;
        }

        if (!Typing::isNumber($left)) {
            throw new Exception("fn2 :: pow,1st," . Typing::getType($left));
        }

        if (!Typing::isNumber($right)) {
            throw new Exception("fn2 :: pow,2nd," . Typing::getType($right));
        }

        $result = pow($left, $right);

        if ($result > Typing::$DOUBLE_RANGE) {
            throw new Exception("pow3");
        }

        if (Typing::isNaN($result)) {
            throw new Exception("pow4");
        }

        return $result;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$let' => [
                'vars' => [
                    'pow' => [
                        '$convert' => [
                            'input' => [
                                '$pow' => array_map(
                                    fn($arg) => $arg->toMongoExpression($localVariables, $fieldNames, $options),
                                    $this->arguments
                                )
                            ],
                            // Иначе может вернуть Long зачем-то
                            'to' => 'double',
                        ],
                    ]
                ],
                'in' => [
                    '$switch' => [
                        'branches' => [[
                            'case' => ['$eq' => ['$$pow', [
                                '$pow' => [-1, 0.5] // NaN
                            ]]],
                            'then' => [
                                '$dateFromString' => [
                                    'dateString' => '$_this_is_missing',
                                    'format' => ['_throw_ pow4'],
                                ],
                            ]
                        ], [
                            'case' => ['$gt' => ['$$pow', Typing::$DOUBLE_RANGE]],
                            'then' => [
                                '$dateFromString' => [
                                    'dateString' => '$_this_is_missing',
                                    'format' => ['_throw_ pow3'],
                                ],
                            ]
                        ]],
                        'default' => '$$pow',
                    ]
                ]
            ]
        ];
    }
}