<?php

namespace formulas\functions\text;

use Exception;
use formulas\Convertation;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\JavaScript;
use formulas\literals\StringLiteral;
use formulas\OptimizedNode;
use formulas\Typing;

class RegexTestFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 3;

    static function validateFlags($flags)
    {
        return preg_match('/^[ims]*$/', $flags) === 1;
    }

    public function optimize(): ExpressionNode
    {
        $this->arguments[1] = $this->arguments[1]->optimize();

        if ($this->arguments[1] instanceof OptimizedNode) {
            if (!Typing::isNull($this->arguments[1]->result) && !Typing::isString($this->arguments[1]->result)) {
                throw new Exception('fn4 :: regexTest,2nd');
            }
        }

        return $this;
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);
        $regex = $this->arguments[1]->evaluate($scope);

        if (Typing::isNull($input)) {
            return false;
        } elseif (!Typing::isString($input)) {
            throw new Exception('fn4 :: regexTest,1st');
        }

        if (Typing::isNull($regex)) {
            return false;
        } elseif (!Typing::isString($regex)) {
            throw new Exception('fn4 :: regexTest,2nd');
        }

        $flags = '';
        if (count($this->arguments) > 2) {
            if ($this->arguments[2] instanceof StringLiteral) {
                $flags = $this->arguments[2]->evaluate($scope);

                if (!self::validateFlags($flags)) {
                    throw new Exception('regexTest4');
                }
            } else {
                throw new Exception('regexTest3');
            }
        }

        if (JavaScript::isAvailable()) {
            return JavaScript::evaluate(<<<JS
                let re;
                try {
                    re = new RegExp(regex, flags + 'u');
                } catch (e) {
                    throw new Error('regexTest3');
                }

                return re.test(input);
            JS, [
                'input' => $input,
                'regex' => $regex,
                'flags' => $flags,
            ]);
        } else {
            // Глушим ошибки через @, но потом ловим их через preg_last_error, иначе Warning не поймать
            $result = @preg_match('/' . $regex . '/' . $flags, $input) === 1;
            if (preg_last_error() !== PREG_NO_ERROR) {
                throw new Exception('regexTest3');
            }

            return $result;
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if (count($this->arguments) > 2) {
            if ($this->arguments[2] instanceof StringLiteral) {
                $flags = $this->arguments[2]->toMongoExpression($localVariables, $fieldNames, $options);

                if (!self::validateFlags($this->arguments[2]->value)) {
                    return [
                        '$dateFromString' => [
                            'dateString' => '$_this_is_missing',
                            'format' => ['_throw_ regexTest4'],
                        ],
                    ];
                }
            } else {
                return [
                    '$dateFromString' => [
                        'dateString' => '$_this_is_missing',
                        'format' => ['_throw_ regexTest3'],
                    ],
                ];
            }
        } else {
            $flags = '';
        }

        return [
            '$regexMatch' => [
                'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                'regex' => $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                'options' => $flags,
            ],
        ];
    }
}