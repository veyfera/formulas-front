<?php

namespace formulas\functions\type;

use formulas\Convertation;
use formulas\functions\AbstractFunction;
use formulas\Identifier;
use formulas\OptimizedNode;

class ToBooleanFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return Convertation::toBoolean($this->arguments[0]->evaluate($scope));
    }

    /**
     * @var string[] Список классов, которые гарантировано возвращают boolean
     */
    static $ALWAYS_RETURNS_BOOLEAN = [
        \formulas\functions\compare\EqualFunction::class,
        \formulas\functions\compare\NotEqualFunction::class,
        \formulas\functions\compare\GreaterFunction::class,
        \formulas\functions\compare\GreaterOrEqualFunction::class,
        \formulas\functions\compare\LessFunction::class,
        \formulas\functions\compare\LessOrEqualFunction::class,
        \formulas\functions\logic\OrFunction::class,
        \formulas\functions\logic\AndFunction::class,
        \formulas\literals\BooleanLiteral::class,
    ];

    // TODO можно еще список классов выделить, которые гарантировано не возвращают строки,
    // и для них тоже упростить условие до простой конвертации ($convert) в boolean, без
    // сравнения с пустой строкой

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        // Если переданный аргумент всегда возвращает boolean, то мы не добавляем никаких оберток
        foreach (self::$ALWAYS_RETURNS_BOOLEAN as $safeClass) {
            if ($this->arguments[0] instanceof $safeClass) {
                return $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options);
            }
        }

        if ($options['testing']) {
            return [
                '$and' => [
                    $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                    ['$ne' => [$this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options), '']]
                ]
            ];
        }

        // Это единственное место во всех выражениях, где мы оптимизируем запрос перед тем,
        // как отдать его монге. Делаем мы это потому что $let не оптимизируется, а он по
        // сути является костылем, и мы таким образом максимально сводим поведение запросов
        // к тому, каким оно было бы, если бы не было $let. То есть мы оптимизацию монги
        // делаем на своей стороне.
        $optimizedNode = $this->arguments[0]->optimize();

        if ($optimizedNode instanceof OptimizedNode || $optimizedNode instanceof Identifier) {
            // Если выражение простое, тогда мы позволяем ему выполниться дважды,
            // поскольку оптимизатор монги еще до выполнения запроса все поймет

            return [
                '$and' => [
                    $optimizedNode->toMongoExpression($localVariables, $fieldNames, $options),
                    ['$ne' => [$optimizedNode->toMongoExpression($localVariables, $fieldNames, $options), '']]
                ]
            ];
        } else {
            // Если выражение сложное, тогда мы оборачиваем все в $let, чтобы избежать
            // двойного выполнения выражения и значительного замедления запроса

            return [
                '$let' => [
                    'vars' => [
                        'value' => $optimizedNode->toMongoExpression($localVariables, $fieldNames, $options),
                    ],
                    'in' => [
                        '$and' => [
                            '$$value',
                            ['$ne' => ['$$value', '']]
                        ]
                    ]
                ]
            ];
        }
    }
}