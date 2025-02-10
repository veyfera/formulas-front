<?php

namespace formulas\functions\objects;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class PickKeysFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);
        $keys = $this->arguments[1]->evaluate($scope);

        if (!Typing::isObject($input)) {
            throw new Exception('pickKeys1 :: ' . Typing::getType($input));
        } elseif (!Typing::isArray($keys)) {
            throw new Exception('pickKeys2 :: ' . Typing::getType($keys));
        } else {
            $result = new \stdClass();
            foreach ($keys as $item) {
                if (!Typing::isString($item)) {
                    throw new Exception('pickKeys3 :: array,' . Typing::getType($item));
                } elseif (property_exists($input, $item)) {
                   $result->$item = $input->$item;
                }
            }
            return $result;
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$arrayToObject' => [
                '$filter' => [
                    'input' => [
                        '$objectToArray' => [
                            $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                        ]
                    ],
                    'as' => 'item',
                    'cond' => [
                        '$in' => ['$$item.k', $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options)]
                    ]
                ]
            ]
        ];
    }
}
