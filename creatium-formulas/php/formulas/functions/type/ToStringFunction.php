<?php

namespace formulas\functions\type;

use formulas\Convertation;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class ToStringFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function optimize(): ExpressionNode
    {
        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return Convertation::toString($this->arguments[0]->evaluate($scope));
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$let' => [
                'vars' => [
                    'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                ],
                'in' => [
                    '$cond' => [
                        'if' => ['$and' => [
                            // Если конвертирется число,
                            ['$isNumber' => '$$input'],
                            // ... и находится в пределах безопасных значений
                            ['$lte' => ['$$input', Typing::$MONGO_LONG_MAX]],
                            ['$gte' => ['$$input', Typing::$MONGO_LONG_MIN]],
                        ]],
                        'then' => [
                            '$cond' => [
                                'if' => ['$and' => [
                                    // ... и оно целое,
                                    ['$eq' => ['$$input', ['$trunc' => ['$$input']]]],
                                ]],
                                'then' => [
                                    // ... то мы его конвертируем через long, чтобы оттянуть появление экспоненты
                                    '$convert' => [
                                        'input' => [
                                            '$convert' => [
                                                'input' => '$$input',
                                                'to' => 'long',
                                            ],
                                        ],
                                        'to' => 'string',
                                    ],
                                ],
                                'else' => [
                                    // Дробные числа к строке приводим, отдельно приводя к строке целую и дробную
                                    // часть, и только там можно избежать экспоненциальной записи на малых числах
                                    '$concat' => [
                                        ['$toString' => ['$trunc' => [[
                                            '$convert' => [
                                                'input' => '$$input',
                                                'to' => 'long',
                                            ],
                                        ]]]],
                                        ['$substrCP' => [['$abs' => ['$subtract' => [
                                            '$$input', ['$trunc' => ['$$input']]
                                        ]]], 1, Typing::$INT32_RANGE]]
                                    ],
                                ]
                            ]
                        ],
                        'else' => [
                            '$convert' => [
                                'input' => '$$input',
                                'to' => 'string',
                                'onNull' => '',
                            ],
                        ]
                    ]
                ]
            ]
        ];
    }
}