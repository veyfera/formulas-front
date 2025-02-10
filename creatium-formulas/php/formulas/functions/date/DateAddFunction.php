<?php

namespace formulas\functions\date;

use Exception;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\literals\NullLiteral;
use formulas\Typing;

class DateAddFunction extends AbstractFunction
{
    protected int $minArguments = 3;
    protected int $maxArguments = 3;

    public function optimize(): ExpressionNode
    {
        if ($this->arguments[0] instanceof NullLiteral) {
            return $this->arguments[0]->optimize();
        }

        return parent::optimize();
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);
        $unit = $this->arguments[1]->evaluate($scope);

        if (Typing::isNull($unit)) {
            return null;
        } elseif (Typing::isString($unit)) {
            if (!in_array($unit, ['year', 'quarter', 'week', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'])) {
                throw new Exception('dateAdd3');
            }
        } else {
            throw new Exception('dateAdd1 :: ' . Typing::getType($unit));
        }

        if (Typing::isNull($input)) {
            return null;
        } elseif (Typing::isDate($input)) {
            $amount = $this->arguments[2]->evaluate($scope);

            if (Typing::isNull($amount)) {
                return null;
            } elseif (Typing::isNumber($amount)) {
                if (intval($amount) == $amount) {
                    return $this->addTime($input, $unit, $amount);
                } else {
                    throw new Exception('dateAdd4');
                }
            } else {
                throw new Exception('dateAdd4');
            }
        } else {
            throw new Exception('dateAdd2');
        }
    }

    protected function addTime($date, $unit, $amount)
    {
        $newDate = clone $date;
        $originalDay = $newDate->format('d');

        switch ($unit) {
            case 'year':
                $newDate->modify("+$amount years");
                if ($newDate->format('d') != $originalDay) {
                    $newDate->modify('last day of last month');
                }
                break;
            case 'quarter':
                $newDate->modify("+" . ($amount * 3) . " months");
                if ($newDate->format('d') != $originalDay) {
                    $newDate->modify('last day of last month');
                }
                break;
            case 'week':
                $newDate->modify("+$amount weeks");
                break;
            case 'month':
                $newDate->modify("+$amount months");
                if ($newDate->format('d') != $originalDay) {
                    $newDate->modify('last day of last month');
                }
                break;
            case 'day':
                $newDate->modify("+$amount days");
                break;
            case 'hour':
                $newDate->modify("+$amount hours");
                break;
            case 'minute':
                $newDate->modify("+$amount minutes");
                break;
            case 'second':
                $newDate->modify("+$amount seconds");
                break;
            case 'millisecond':
                $newDate->modify("+$amount milliseconds");
                break;
            default:
                throw new Exception('dateAdd3');
        }

        return $newDate;
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$dateAdd' => [
                'startDate' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                'unit' => $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                'amount' => $this->arguments[2]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}