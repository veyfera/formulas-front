<?php

namespace formulas\functions\text;

use Exception;
use formulas\ExpressionNode;
use formulas\functions\AbstractFunction;
use formulas\JavaScript;
use formulas\literals\StringLiteral;
use formulas\OptimizedNode;
use formulas\Typing;

class RegexMatchAllFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 3;

    public function optimize(): ExpressionNode
    {
        $this->arguments[1] = $this->arguments[1]->optimize();

        if ($this->arguments[1] instanceof OptimizedNode) {
            if (!Typing::isNull($this->arguments[1]->result) && !Typing::isString($this->arguments[1]->result)) {
                throw new Exception('fn4 :: regexMatchAll,2nd');
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
            return [];
        } elseif (!Typing::isString($input)) {
            throw new Exception('fn4 :: regexMatchAll,1st');
        }

        if (Typing::isNull($regex)) {
            return [];
        } elseif (!Typing::isString($regex)) {
            throw new Exception('fn4 :: regexMatchAll,2nd');
        }

        $flags = '';
        if (count($this->arguments) > 2) {
            if ($this->arguments[2] instanceof StringLiteral) {
                $flags = $this->arguments[2]->evaluate($scope);

                if (!RegexTestFunction::validateFlags($flags)) {
                    throw new Exception('regexMatchAll4');
                }
            } else {
                throw new Exception('regexMatchAll3');
            }
        }

        if (JavaScript::isAvailable()) {
            return JavaScript::evaluate(<<<JS
                let re;
                try {
                    re = new RegExp(regex, flags + 'ug');
                } catch (e) {
                    throw new Error('regexMatchAll3');
                }

                const matches = [];

                let nextResult;
                while ((nextResult = re.exec(input)) !== null) {
                    matches.push({
                        match: nextResult[0],
                        idx: nextResult.index,
                        captures: nextResult.slice(1),
                    });
                }

                return matches;
            JS, [
                'input' => $input,
                'regex' => $regex,
                'flags' => $flags,
            ]);
        } else {
            // Глушим ошибки через @, но потом ловим их через preg_last_error, иначе Warning не поймать
            $found = @preg_match_all('/' . $regex . '/' . $flags, $input, $matches, PREG_OFFSET_CAPTURE);
            if (preg_last_error() !== PREG_NO_ERROR) {
                throw new Exception('regexMatchAll3');
            }

            if ($found) {
                $results = [];

                foreach ($matches[0] as $index => $match) {
                    $result = (object) [
                        'match' => $match[0],
                        'idx' => RegexMatchFunction::byteOffsetToCharOffset($input, $match[1]),
                        'captures' => []
                    ];

                    for ($i = 1; $i < count($matches); $i++) {
                        $result->captures[] = $matches[$i][$index][0];
                    }

                    $results[] = $result;
                }

                return $results;
            } else {
                return [];
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
                            'format' => ['_throw_ regexMatchAll4'],
                        ],
                    ];
                }
            } else {
                return [
                    '$dateFromString' => [
                        'dateString' => '$_this_is_missing',
                        'format' => ['_throw_ regexMatchAll3'],
                    ],
                ];
            }
        } else {
            $flags = '';
        }

        return [
            '$regexFindAll' => [
                'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                'regex' => $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                'options' => $flags,
            ],
        ];
    }
}