<?php

namespace formulas;

class Comparison
{
    static function canCompareTypes($type)
    {
        if ($type === Typing::$TYPE_NUMBER) return true;
        if ($type === Typing::$TYPE_DATE) return true;
        if ($type === Typing::$TYPE_STRING) return true;
        if ($type === Typing::$TYPE_BOOLEAN) return true;
        if ($type === Typing::$TYPE_ARRAY) return true;
        if ($type === Typing::$TYPE_OBJECT) return true;
        return false;
    }

    static function isEqual($left, $right)
    {
        if (Typing::isNumber($left) && Typing::isNumber($right)) {
            if (Typing::isNaN($left) && Typing::isNaN($right)) {
                return true;
            }

            // Сравниваем так, иначе int(-2) !== float(-2)
            return floatval($left) === floatval($right);
        }

        if (Typing::isDate($left) && Typing::isDate($right)) {
            // Даты сравниваем нестрого
            return $left == $right;
        }

        if (Typing::isArray($left) && Typing::isArray($right)) {
            if (count($left) !== count($right)) return false;

            foreach ($left as $index => $leftItem) {
                if (!self::isEqual($leftItem, $right[$index])) return false;
            }

            return true;
        }

        if (Typing::isObject($left) && Typing::isObject($right)) {
            $leftKeys = array_keys(get_object_vars($left));
            $rightKeys = array_keys(get_object_vars($right));

            if (count($leftKeys) !== count($rightKeys)) return false;

            foreach ($leftKeys as $index => $leftKey) {
                $rightKey = $rightKeys[$index];
                if (!self::isEqual($leftKey, $rightKey)) return false;
                if (!self::isEqual($left->$leftKey, $right->$rightKey)) return false;
            }

            return true;
        }

        return $left === $right;
    }

    static function isGreater($left, $right)
    {
        $leftType = Typing::getType($left);
        $rightType = Typing::getType($right);
        $sameType = $leftType === $rightType;

        if ($sameType && self::canCompareTypes($leftType)) {
            if ($leftType === Typing::$TYPE_ARRAY) {
                foreach ($left as $index => $leftValue) {
                    if (count($right) < $index + 1) return true;

                    if (!self::isEqual($leftValue, $right[$index])) {
                        return self::isGreater($leftValue, $right[$index]);
                    }
                }

                return false;
            } elseif ($leftType === Typing::$TYPE_OBJECT) {
                $leftKeys = array_keys(get_object_vars($left));
                $rightKeys = array_keys(get_object_vars($right));

                foreach ($leftKeys as $index => $leftKey) {
                    if (count($rightKeys) < $index + 1) return true;

                    $rightKey = $rightKeys[$index];

                    if (!self::isEqual($leftKey, $rightKey)) {
                        return self::isGreater($leftKey, $rightKey);
                    }

                    if (!self::isEqual($left->$leftKey, $right->$rightKey)) {
                        return self::isGreater($left->$leftKey, $right->$rightKey);
                    }
                }

                return false;
            } elseif (!Typing::isNaN($left) && Typing::isNaN($right)) {
                // Любое число, даже -Infinity > NaN
                return true;
            } else {
                return $left > $right;
            }
        } else {
            $order = [
                Typing::$TYPE_NULL,
                Typing::$TYPE_NUMBER,
                Typing::$TYPE_STRING,
                Typing::$TYPE_OBJECT,
                Typing::$TYPE_ARRAY,
                Typing::$TYPE_BOOLEAN,
                Typing::$TYPE_DATE,
            ];

            return array_search($leftType, $order) > array_search($rightType, $order);
        }
    }

    static function isLess($left, $right)
    {
        return !self::isEqual($left, $right) && !self::isGreater($left, $right);
    }
}