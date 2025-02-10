<?php

namespace formulas\functions\date;

use DateTime;
use formulas\functions\AbstractFunction;

class NowFunction extends AbstractFunction
{
    protected int $minArguments = 0;
    protected int $maxArguments = 0;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $date = new DateTime();

        // Отрезаем миллисекунды
        $date->setTimestamp($date->getTimestamp());

        return $date;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$dateTrunc' => [
                'date' => '$$NOW',
                'unit' => 'second',
            ],
        ];
    }
}