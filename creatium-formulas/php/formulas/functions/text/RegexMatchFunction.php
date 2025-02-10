<?php

namespace formulas\functions\text;

use Exception;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\JavaScript;
use formulas\literals\StringLiteral;
use formulas\OptimizedNode;
use formulas\Typing;

class RegexMatchFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 3;

    public function optimize(): ExpressionNode
    {
        $this->arguments[1] = $this->arguments[1]->optimize();

        if ($this->arguments[1] instanceof OptimizedNode) {
            if (!Typing::isNull($this->arguments[1]->result) && !Typing::isString($this->arguments[1]->result)) {
                throw new Exception('fn4 :: regexMatch,2nd');
            }
        }

        return $this;
    }

    static function byteOffsetToCharOffset($string, $byteOffset) {
        return mb_strlen(mb_strcut($string, 0, $byteOffset));
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);
        $regex = $this->arguments[1]->evaluate($scope);

        if (Typing::isNull($input)) {
            return null;
        } elseif (!Typing::isString($input)) {
            throw new Exception('fn4 :: regexMatch,1st');
        }

        if (Typing::isNull($regex)) {
            return null;
        } elseif (!Typing::isString($regex)) {
            throw new Exception('fn4 :: regexMatch,2nd');
        }

        $flags = '';
        if (count($this->arguments) > 2) {
            if ($this->arguments[2] instanceof StringLiteral) {
                $flags = $this->arguments[2]->evaluate($scope);

                if (!RegexTestFunction::validateFlags($flags)) {
                    throw new Exception('regexMatch4');
                }
            } else {
                throw new Exception('regexMatch3');
            }
        }

        if (JavaScript::isAvailable()) {
            return JavaScript::evaluate(<<<JS
                let re;
                try {
                    re = new RegExp(regex, flags + 'u');
                } catch (e) {
                    throw new Error('regexMatch3');
                }

                const result = re.exec(input);

                return result ? {
                    match: result[0],
                    idx: result.index,
                    captures: result.slice(1)
                } : null;
            JS, [
                'input' => $input,
                'regex' => $regex,
                'flags' => $flags,
            ]);
        } else {
            // Глушим ошибки через @, но потом ловим их через preg_last_error, иначе Warning не поймать
            $found = @preg_match('/' . $regex . '/' . $flags, $input, $matches, PREG_OFFSET_CAPTURE);
            if (preg_last_error() !== PREG_NO_ERROR) {
                throw new Exception('regexMatch3');
            }

            if ($found) {
                $result = (object) [
                    'match' => $matches[0][0],
                    'idx' => static::byteOffsetToCharOffset($input, $matches[0][1]),
                    'captures' => []
                ];

                for ($i = 1; $i < count($matches); $i++) {
                    $result->captures[] = $matches[$i][0];
                }

                return $result;
            } else {
                return null;
            }
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        if (count($this->arguments) > 2) {
            if ($this->arguments[2] instanceof StringLiteral) {
                $flags = $this->arguments[2]->toMongoExpression($localVariables, $fieldNames, $options);

                if (!RegexTestFunction::validateFlags($this->arguments[2]->value)) {
                    return [
                        '$dateFromString' => [
                            'dateString' => '$_this_is_missing',
                            'format' => ['_throw_ regexMatch4'],
                        ],
                    ];
                }
            } else {
                return [
                    '$dateFromString' => [
                        'dateString' => '$_this_is_missing',
                        'format' => ['_throw_ regexMatch3'],
                    ],
                ];
            }
        } else {
            $flags = '';
        }

        return [
            '$regexFind' => [
                'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                'regex' => $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                'options' => $flags,
            ],
        ];
    }
}