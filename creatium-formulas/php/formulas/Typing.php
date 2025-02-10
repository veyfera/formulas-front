<?php

namespace formulas;

use DateTime;
use stdClass;

class Typing
{
    static public $TYPE_DATE = 'date';
    static public $TYPE_ARRAY = 'array';
    static public $TYPE_OBJECT = 'object';
    static public $TYPE_NUMBER = 'number';
    static public $TYPE_STRING = 'string';
    static public $TYPE_BOOLEAN = 'boolean';
    static public $TYPE_NULL = 'null';

    static function ISO8601_PATTERN()
    {
        return implode([
            '^',
            '\\d\\d\\d\\d', // year
            '-(0\\d|1[0-2])', // month
            '(',
                '-([0-2]\\d|3[01])', // day
            ')?',
            '(',
                '[Tt ]', // separator
                '([01][0-9]|2[0-3])', // hours
                ':[0-5]\\d', // minutes
                '(',
                    ':[0-5]\\d', // seconds
                    '(',
                        '\\.\\d+', // milliseconds
                    ')?',
                ')?',
            ')?',
            '(',
                '[Zz]', // Zulu time
                '|', // or
                ' ?',
                '[+-]', // timezone
                '([01][0-9]|2[0-3])',
                '(',
                    ':?[0-5]\\d',
                ')?',
            ')?',
            '$',
        ]);
    }

    // Диапазон времени, в котором безопасно работать:
    // https://262.ecma-international.org/5.1/#sec-15.9.1.1
    static $TIMESTAMP_RANGE = 8_640_000_000_000_000;

    // Допустимый диапазон 32 int
    static $INT32_RANGE = 2_147_483_647;

    // Допустимый диапазон double
    static $DOUBLE_RANGE = 1.7976931348623157e+308;

    // Почему-то эти ограничения всплывают во многих местах в монге
    static $MONGO_LONG_MIN = -9223372036854776832;
    static $MONGO_LONG_MAX = 9223372036854775295;

    static function isNull($value)
    {
        return is_null($value);
    }

    static function isNumber($value)
    {
        return is_int($value) || is_float($value);
    }

    static function hasFractionalPart($value)
    {
        return $value != intval($value);
    }

    static function isFinite($value)
    {
        return !is_infinite($value) && !is_nan($value);
    }

    static function isInfinite($value)
    {
        return is_infinite($value);
    }

    static function isNaN($value)
    {
        return is_float($value) && is_nan($value);
    }

    static function isDate($value)
    {
        return $value instanceof DateTime;
    }

    static function is32BitInteger($value)
    {
        if (!self::isNumber($value)) return false;

        // Проверка на целое число
        if (round($value) !== floatval($value)) return false;

        if ($value < -self::$INT32_RANGE || $value > self::$INT32_RANGE) return false;

        return true;
    }

    static function isBoolean($value)
    {
        return is_bool($value);
    }

    static function isString($value)
    {
        return is_string($value);
    }

    static function isArray($value)
    {
        return is_array($value);
    }

    static function isObject($value)
    {
        return is_object($value) && !self::isDate($value);
    }

    static function isZero($value)
    {
        return $value === 0 || $value === 0.0;
    }

    static function getType($value)
    {
        if (self::isNumber($value)) return self::$TYPE_NUMBER;
        if (self::isBoolean($value)) return self::$TYPE_BOOLEAN;
        if (self::isString($value)) return self::$TYPE_STRING;
        if (self::isNull($value)) return self::$TYPE_NULL;
        if (self::isDate($value)) return self::$TYPE_DATE;
        if (self::isObject($value)) return self::$TYPE_OBJECT;
        if (self::isArray($value)) return self::$TYPE_ARRAY;
    }

    static function fixNegativeZero($number)
    {
        return $number + 0;
    }
}