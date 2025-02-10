<?php

namespace formulas\functions\text;

use Exception;
use formulas\Convertation;
use formulas\Expression;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class SubstrFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 3;

    public function __construct(Expression $Expr, array $arguments)
    {
        if (count($arguments) === 1) {
            $arguments[] = ['type' => 'Number', 'value' => 0];
        }

        if (count($arguments) === 2) {
            $arguments[] = ['type' => 'Number', 'value' => Typing::$INT32_RANGE];
        }

        parent::__construct($Expr, $arguments);
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);
        $start = $this->arguments[1]->evaluate($scope);
        $length = $this->arguments[2]->evaluate($scope);

        if (Typing::isNumber($input) || Typing::isBoolean($input)) {
            $input = Convertation::toString($input);
        } elseif (Typing::isNull($input)) {
            return '';
        } elseif (!Typing::isString($input) && !Typing::isDate($input)) {
            throw new Exception('convert1 :: ' . Typing::getType($input) . ',string');
        }

        if (!Typing::isNumber($start)) {
            throw new Exception('fn2 :: substr,2nd,' . Typing::getType($start));
        } elseif (!Typing::is32BitInteger($start)) {
            throw new Exception('fn3 :: substr,2nd');
        }

        if (!Typing::isNumber($length)) {
            throw new Exception('fn2 :: substr,3rd,' . Typing::getType($length));
        } elseif (!Typing::is32BitInteger($length)) {
            throw new Exception('fn3 :: substr,3rd');
        }

        if ($start < 0) {
            throw new Exception('substr3');
        }

        if ($length < 0) {
            throw new Exception('substr5');
        }

        if (Typing::isDate($input)) {
            $input = Convertation::toString($input);
        }

        return mb_substr($input, $start, $length);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$substrCP' => [
                [
                    // Первый аргумент конверируем в строку, иначе конвертация осуществляется автоматически
                    // по каким-то другим правилам, где Infinity -> inf, NaN -> nan
                    '$convert' => [
                        'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                        'to' => 'string',
                        'onNull' => '',
                    ],
                ],
                $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                $this->arguments[2]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}