<?php

namespace formulas\functions\objects;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class ArrayToObjectFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($input)) {
            return null;
        }

        if (Typing::isArray($input)) {
            $result = new \stdClass();

            $mode = null; // array|object
            foreach ($input as $item) {
                if ($mode === 'array') {
                    if (!Typing::isArray($item)) {
                        throw new Exception('arrayToObject5 :: array,' . Typing::getType($item));
                    }
                } elseif ($mode === 'object') {
                    if (!Typing::isObject($item)) {
                        throw new Exception('arrayToObject5 :: object,' . Typing::getType($item));
                    }
                } else {
                    if (Typing::isArray($item)) {
                        $mode = 'array';
                    } elseif (Typing::isObject($item)) {
                        $mode = 'object';
                    } else {
                        throw new Exception('arrayToObject2 :: ' . Typing::getType($item));
                    }
                }

                if ($mode === 'array') {
                    if (count($item) !== 2) {
                        throw new Exception('arrayToObject4 :: ' . count($item));
                    }

                    if (!Typing::isString($item[0])) {
                        throw new Exception('arrayToObject3 :: ' . Typing::getType($item[0]));
                    }

                    $result->{$item[0]} = $item[1];
                } elseif ($mode === 'object') {
                    $count = count((array) $item);
                    if ($count !== 2) {
                        throw new Exception('arrayToObject7 :: ' . $count);
                    }

                    if (!property_exists($item, 'k') || !property_exists($item, 'v')) {
                        throw new Exception('arrayToObject8');
                    }

                    if (!Typing::isString($item->k)) {
                        throw new Exception('arrayToObject6 :: ' . Typing::getType($item->k));
                    }

                    $result->{$item->k} = $item->v;
                }
            }

            return $result;
        } else {
            throw new Exception('arrayToObject1 :: ' . Typing::getType($input));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$arrayToObject' => [
                $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}