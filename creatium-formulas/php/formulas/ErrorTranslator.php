<?php

namespace formulas;

use Exception;

class ErrorTranslator
{
    static $translations = null;

    static function hasTranslationFor($message)
    {
        $parts = explode(' :: ', $message, 3);
        return isset(self::$translations->{$parts[1]});
    }

    private static function translateTo($message, $language)
    {
        if (self::$translations === null) {
            self::$translations = json_decode(file_get_contents(__DIR__ . '/../../l10n/translations.json'));
        }

        try {
            $parts = explode(' :: ', $message, 3);
            $stage = $parts[0];

            if ($stage === 'optimize' || $stage === 'evaluate') {
                $errcode = $parts[1];
                $errargs = count($parts) > 2 ? explode(',', $parts[2]) : [];

                if (isset(self::$translations->$errcode)) {
                    $translated = self::$translations->$errcode->$language;
                    foreach ($errargs as $key => $errarg) {
                        if (strpos($translated, '$arg') !== false && $key === 1) {
                            // Вставка "Первый/Второй/Третий аргумент" в другие фразы
                            $part = self::$translations->{"arg_$errarg"}->$language;
                            $translated = str_replace('$arg', $part, $translated);
                        } else {
                            $translated = str_replace('$' . ($key + 1), $errarg, $translated);
                        }
                    }

                    return self::$translations->evaluateError->ru . ': ' . $translated;
                } else {
                    return self::$translations->evaluateError->ru . ': ' . $message;
                }
            } elseif (in_array($stage, ['parse', 'validate', 'finalize', 'convert', 'preeval'])) {
                $errcode = $parts[1];
                $errarg = $parts[2] ?? '';

                $translated = str_replace('$1', $errarg, self::$translations->$errcode->$language);

                return self::$translations->{$stage . 'Error'}->ru . ': ' . $translated;
            } else {
                return $message;
            }
        } catch (Exception $e) {
            return $message;
        }
    }

    static function toRussian($message)
    {
        return self::translateTo($message, 'ru');
    }

    static function normalizeMongoType($type)
    {
        if ($type === 'int') return 'number';
        if ($type === 'double') return 'number';
        if ($type === 'long') return 'number';
        if ($type === 'decimal') return 'number';
        if ($type === 'bool') return 'boolean';
        if ($type === 'missing') return 'null';
        return strtolower($type);
    }

    static function normalizeMongoNumber($strnum)
    {
        if ($strnum === 'inf') return 'Infinity';
        if ($strnum === '-inf') return '-Infinity';
        return $strnum;
    }

    static function getTypeFromMongoValue(string $value)
    {
        if ($value[0] === '"') return 'string';
        elseif ($value[0] === '{') return 'object';
        elseif ($value[0] === '[') return 'array';
        elseif (is_numeric($value)) return 'number';
        elseif ($value === 'inf') return 'number';
        elseif ($value === 'nan') return 'number';
        elseif ($value === 'true') return 'boolean';
        elseif ($value === 'false') return 'boolean';
        elseif (preg_match('/' . Typing::ISO8601_PATTERN() . '/', $value)) return 'date';
        else return 'unknown';
    }

    static function parseMongoError($message)
    {
        // Пример ошибки из монги (всегда делятся на 3 части):
        // PlanExecutor error during aggregation :: caused by :: $add only supports numeric or date types, not string
        $parts = explode(' :: ', $message, 3);

        if ($parts[0] === 'Failed to optimize pipeline') {
            $stage = 'optimize';
        } elseif ($parts[0] === 'PlanExecutor error during aggregation') {
            $stage = 'evaluate';
        } else {
            throw new Exception('Unknown error stage: ' . $message);
        }

        $error = $parts[2];

        preg_match('/\\$add only supports numeric or date types, not (\w+)/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: add1 :: ' . $type;
        }

        preg_match('/can\'t \\$subtract (\w+) from (\w+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            $type2 = self::normalizeMongoType($match[2]);
            return $stage . ' :: subtract1 :: ' . $type1 . ',' . $type2;
        }

        preg_match('/can\'t \\$divide by zero/', $error, $match);
        if ($match) {
            return $stage . ' :: divide1';
        }

        preg_match('/\\$arrayElemAt\'s second argument must be a numeric value, but is (\w+)/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: member2 :: ' . $type;
        }

        preg_match('/\\$arrayElemAt\'s second argument must be representable as a 32-bit integer/', $error, $match);
        if ($match) {
            return $stage . ' :: member3';
        }

        preg_match('/^First argument to \\$slice must be an array, but is of type: (\w+)$/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn1 :: slice,' . $type;
        }

        preg_match('/^Second argument to \\$slice must be a numeric value, but is of type: (\w+)$/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: slice3 :: ' . $type;
        }

        preg_match('/^Third argument to \\$slice must be positive: (-?inf|nan|[\d.e+\-]+)$/', $error, $match);
        if ($match) {
            return $stage . ' :: slice2 :: ' . $match[1];
        }

        preg_match('/^\\$substrCP: starting index must be a numeric type \(is BSON type (\w+)\)$/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return "$stage :: fn2 :: substr,2nd,$type";
        }

        preg_match('/\\$substrCP: the starting index must be nonnegative integer\./', $error, $match);
        if ($match) {
            return $stage . ' :: substr3';
        }

        preg_match('/\\$substrCP: length must be a numeric type \(is BSON type (\w+)\)/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn2 :: substr,3rd,' . $type;
        }

        preg_match('/\\$substrCP: length must be a nonnegative integer\./', $error, $match);
        if ($match) {
            return $stage . ' :: substr5';
        }

        preg_match('/\\$substrCP: starting index cannot be represented as a 32-bit integral value: (-?inf|nan|[\d.e+\-]+)/', $error, $match);
        if ($match) {
            return $stage . ' :: fn3 :: substr,2nd';
        }

        preg_match('/\\$substrCP: length cannot be represented as a 32-bit integral value: (-?inf|nan|[\d.e+\-]+)/', $error, $match);
        if ($match) {
            return $stage . ' :: fn3 :: substr,3rd';
        }

        preg_match('/Second argument to \\$(\w+) can\'t be represented as a 32-bit integer: (-?inf|nan|[\d.e+\-]+)/', $error, $match);
        if ($match) {
            return "$stage :: fn3 :: $match[1],2nd";
        }

        preg_match('/Third argument to \\$(\w+) can\'t be represented as a 32-bit integer: (-?inf|nan|[\d.e+\-]+)/', $error, $match);
        if ($match) {
            return "$stage :: fn3 :: $match[1],3rd";
        }

        preg_match('/^\\$pow\'s base must be numeric, not (\w+)$/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn2 :: pow,1st,' . $type;
        }

        preg_match('/^\\$pow\'s exponent must be numeric, not (\w+)$/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn2 :: pow,2nd,' . $type;
        }

        preg_match('/^\\$(\w+) only supports numeric types, not (\w+)$/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[2]);
            return "$stage :: fn7 :: $match[1],$type";
        }

        preg_match('/^\\$sqrt\'s argument must be greater than or equal to 0$/', $error, $match);
        if ($match) {
            return $stage . ' :: sqrt2';
        }

        preg_match('/cannot apply \\$sin to -?inf, value must be in \(-inf,inf\)/', $error, $match);
        if ($match) {
            return $stage . ' :: sin2';
        }

        preg_match('/cannot apply \\$cos to -?inf, value must be in \(-inf,inf\)/', $error, $match);
        if ($match) {
            return $stage . ' :: cos2';
        }

        preg_match('/cannot apply \\$tan to -?inf, value must be in \(-inf,inf\)/', $error, $match);
        if ($match) {
            return $stage . ' :: tan2';
        }

        preg_match('/^cannot apply \\$acos to (-?inf|[\d.e+\-]+), value must be in \[-1,1\]$/', $error, $match);
        if ($match) {
            $value = self::normalizeMongoNumber($match[1]);
            return $stage . ' :: acos2 :: ' . $value;
        }

        preg_match('/^cannot apply \\$atanh to (-?inf|[\d.e+\-]+), value must be in \[-1,1\]$/', $error, $match);
        if ($match) {
            $value = self::normalizeMongoNumber($match[1]);
            return $stage . ' :: atanh2 :: ' . $value;
        }

        preg_match('/^cannot apply \\$asin to (-?inf|[\d.e+\-]+), value must be in \[-1,1\]$/', $error, $match);
        if ($match) {
            $value = self::normalizeMongoNumber($match[1]);
            return $stage . ' :: asin2 :: ' . $value;
        }

        preg_match('/^cannot apply \\$acosh to (-?inf|[\d.e+\-]+), value must be in \[1,inf\]$/', $error, $match);
        if ($match) {
            $value = self::normalizeMongoNumber($match[1]);
            return $stage . ' :: acosh2 :: ' . $value;
        }

        preg_match('/^\\$log\'s argument must be numeric, not (\w+)$/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn2 :: log,1st,' . $type;
        }

        preg_match('/^\\$log\'s base must be numeric, not (\w+)$/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn2 :: log,2nd,' . $type;
        }

        preg_match('/^\\$log\'s argument must be a positive number, but is (-?inf|nan|[\d.e+\-]+)$/', $error, $match);
        if ($match) {
            return $stage . ' :: log3';
        }

        preg_match('/^\\$log\'s base must be a positive number not equal to 1, but is (-?inf|nan|[\d.e+\-]+)$/', $error, $match);
        if ($match) {
            return $stage . ' :: log4';
        }

        preg_match('/\\$range requires a starting value that can be represented as a 32-bit integer, found value: (-?inf|nan|[\d.e+\-]+)/', $error, $match);
        if ($match) {
            return $stage . ' :: fn3 :: range,1st';
        }

        preg_match('/\\$range requires an ending value that can be represented as a 32-bit integer, found value: (-?inf|nan|[\d.e+\-]+)/', $error, $match);
        if ($match) {
            return $stage . ' :: fn3 :: range,2nd';
        }

        preg_match('/\\$range requires a step value that can be represented as a 32-bit integer, found value: (-?inf|nan|[\d.e+\-]+)/', $error, $match);
        if ($match) {
            return $stage . ' :: fn3 :: range,3rd';
        }

        preg_match('/\\$range requires a non-zero step value/', $error, $match);
        if ($match) {
            return $stage . ' :: range7';
        }

        preg_match('/\\$divide only supports numeric types, not (\w+) and (\w+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            $type2 = self::normalizeMongoType($match[2]);
            return $stage . ' :: divide2 :: ' . $type1 . ',' . $type2;
        }

        preg_match('/can\'t \\$mod by zero/', $error, $match);
        if ($match) {
            return $stage . ' :: mod1';
        }

        preg_match('/^input to \\$(\w+) must be an array not (\w+)$/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[2]);
            return "$stage :: fn1 :: $match[1],$type";
        }

        preg_match('/^The argument to \\$(\w+) must be an array, but was of type: (\w+)$/', $error, $match);
        if ($match) {
            if ($match[1] === 'size') $match[1] = 'count';
            if ($match[1] === 'reverseArray') $match[1] = 'reverse';
            $type = self::normalizeMongoType($match[2]);
            return "$stage :: fn1 :: $match[1],$type";
        }

        preg_match('/\\$split requires an expression that evaluates to a string as a first argument, found: (\w+)/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn5 :: split,1st,' . $type;
        }

        preg_match('/\\$split requires an expression that evaluates to a string as a second argument, found: (\w+)/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn5 :: split,2nd,' . $type;
        }

        preg_match('/\\$split requires a non-empty separator/', $error, $match);
        if ($match) {
            return $stage . ' :: split3';
        }

        preg_match('/^\\$(\w+) requires that \'input\' be an array, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::getTypeFromMongoValue($match[2]);
            return "$stage :: fn1 :: $match[1],$type1";
        }

        preg_match('/\\$in requires an array as a second argument, found: (.+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: in1 :: ' . $type1;
        }

        preg_match('/^\\$indexOfArray requires an array as a first argument, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: indexOf1 :: ' . $type1;
        }

        preg_match('/^\\$arrayToObject requires an array input, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: arrayToObject1 :: ' . $type1;
        }

        preg_match('/^Unrecognised input type format for \\$arrayToObject: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: arrayToObject2 :: ' . $type1;
        }

        preg_match('/^\\$arrayToObject requires an array of key-value pairs, where the key must be of type string\. Found key type: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: arrayToObject3 :: ' . $type1;
        }

        preg_match('/^\\$arrayToObject requires an array of size 2 arrays,found array of size: (\d+)$/', $error, $match);
        if ($match) {
            return $stage . ' :: arrayToObject4 :: ' . $match[1];
        }

        preg_match('/^\\$arrayToObject requires a consistent input format. Elements mustall be arrays or all be objects. (Array|Object) was detected, now found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = strtolower($match[1]);
            $type2 = self::normalizeMongoType($match[2]);
            return $stage . ' :: arrayToObject5 :: ' . $type1 . ',' . $type2;
        }

        preg_match('/^\\$arrayToObject requires an object with keys \'k\' and \'v\', where the value of \'k\' must be of type string. Found type: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: arrayToObject6 :: ' . $type1;
        }

        preg_match('/^\\$arrayToObject requires an object keys of \'k\' and \'v\'. Found incorrect number of keys:(\d+)$/', $error, $match);
        if ($match) {
            return $stage . ' :: arrayToObject7 :: ' . $match[1];
        }

        preg_match('/^\\$arrayToObject requires an object with keys \'k\' and \'v\'. Missing either or both keys from: .+$/', $error, $match);
        if ($match) {
            return $stage . ' :: arrayToObject8';
        }

        preg_match('/^\\$objectToArray requires a document input, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: objectToArray1 :: ' . $type1;
        }

        preg_match('/^\\$replaceOne requires that \'input\' be a string, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::getTypeFromMongoValue($match[1]);
            return $stage . ' :: fn5 :: replace,1st,' . $type1;
        }

        preg_match('/^\\$replaceOne requires that \'find\' be a string, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::getTypeFromMongoValue($match[1]);
            return $stage . ' :: fn5 :: replace,2nd,' . $type1;
        }

        preg_match('/^\\$replaceOne requires that \'replacement\' be a string, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::getTypeFromMongoValue($match[1]);
            return $stage . ' :: fn5 :: replace,3rd,' . $type1;
        }

        preg_match('/^\\$replaceAll requires that \'input\' be a string, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::getTypeFromMongoValue($match[1]);
            return $stage . ' :: fn5 :: replaceAll,1st,' . $type1;
        }

        preg_match('/^\\$replaceAll requires that \'find\' be a string, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::getTypeFromMongoValue($match[1]);
            return $stage . ' :: fn5 :: replaceAll,2nd,' . $type1;
        }

        preg_match('/^\\$replaceAll requires that \'replacement\' be a string, found: (.+)$/', $error, $match);
        if ($match) {
            $type1 = self::getTypeFromMongoValue($match[1]);
            return $stage . ' :: fn5 :: replaceAll,3rd,' . $type1;
        }

        preg_match('/\\$strLenCP requires a string argument, found: (.+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn6 :: length,' . $type1;
        }

        preg_match('/\\$range requires a numeric starting value, found value of type: (.+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn2 :: range,1st,' . $type1;
        }

        preg_match('/\\$range requires a numeric ending value, found value of type: (.+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn2 :: range,2nd,' . $type1;
        }

        preg_match('/\\$range requires a numeric step value, found value of type:(.+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn2 :: range,3rd,' . $type1;
        }

        preg_match('/\\$indexOfCP requires a string as the first argument, found: (.+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn5 :: locate,1st,' . $type1;
        }

        preg_match('/\\$indexOfCP requires a string as the second argument, found: (.+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn5 :: locate,2nd,' . $type1;
        }

        preg_match('/\\$trim requires its input to be a string, got .+ \(of type (.+)\) instead\./', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn6 :: trim,' . $type1;
        }

        preg_match('/\\$ltrim requires its input to be a string, got .+ \(of type (.+)\) instead\./', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn6 :: trimStart,' . $type1;
        }

        preg_match('/\\$rtrim requires its input to be a string, got .+ \(of type (.+)\) instead\./', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn6 :: trimEnd,' . $type1;
        }

        preg_match('/\\$(dateAdd|dateSubtract) requires \'unit\' to be a string, but got (.+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[2]);
            $fn = $match[1];
            return $stage . ' :: ' . $fn . '1 :: ' . $type1;
        }

        preg_match('/\\$(dateAdd|dateSubtract) requires startDate to be convertible to a date/', $error, $match);
        if ($match) {
            $fn = $match[1];
            return $stage . ' :: ' . $fn . '2';
        }

        preg_match('/\\$(dateAdd|dateSubtract) parameter \'unit\' value parsing failed :: caused by :: unknown time unit value: .+/', $error, $match);
        if ($match) {
            $fn = $match[1];
            return $stage . ' :: ' . $fn . '3';
        }

        preg_match('/\\$(dateAdd|dateSubtract) expects integer amount of time units/', $error, $match);
        if ($match) {
            $fn = $match[1];
            return $stage . ' :: ' . $fn . '4';
        }

        preg_match('/invalid (dateAdd|dateSubtract) \'amount\' parameter value: .+/', $error, $match);
        if ($match) {
            $fn = $match[1];
            return $stage . ' :: ' . $fn . '5';
        }

        preg_match('/\\$mod only supports numeric types, not (\w+) and (\w+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            $type2 = self::normalizeMongoType($match[2]);
            return $stage . ' :: mod2 :: ' . $type1 . ',' . $type2;
        }

        preg_match('/Unsupported conversion from (\w+) to (\w+) in \\$convert with no onError/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            $type2 = self::normalizeMongoType($match[2]);
            return $stage . ' :: convert1 :: ' . $type1 . ',' . $type2;
        }

        preg_match('/Could not convert date to string: date component was outside the supported range of 0-9999: (-?\d+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            return $stage . ' :: convert2 :: ' . $type1;
        }

        preg_match('/can\'t convert from BSON type (\w+) to (\w+)/', $error, $match);
        if ($match) {
            $type1 = self::normalizeMongoType($match[1]);
            $type2 = self::normalizeMongoType($match[2]);
            return $stage . ' :: convert3 :: ' . $type1 . ',' . $type2;
        }

        preg_match('/^Failed to parse number \'\' in \\$convert with no onError value: Empty string$/', $error, $match);
        if ($match) {
            return $stage . ' :: convert4';
        }

        preg_match('/^Failed to parse number \'[\s\S]+\' in \\$convert with no onError value: Did not consume any digits$/', $error, $match);
        if ($match) {
            return $stage . ' :: convert5';
        }

        preg_match('/^Failed to parse number \'[\s\S]+\' in \\$convert with no onError value: Did not consume whole string\.$/', $error, $match);
        if ($match) {
            return $stage . ' :: convert5';
        }

        preg_match('/^Failed to parse number \'[\s\S]+\' in \\$convert with no onError value: Leading whitespace$/', $error, $match);
        if ($match) {
            return $stage . ' :: convert5';
        }

        preg_match('/^Illegal hexadecimal input in \\$convert with no onError value: .+$/m', $error, $match);
        if ($match) {
            return $stage . ' :: convert5';
        }

        preg_match('/^Failed to parse number \'[\s\S]+\' in \\$convert with no onError value: Out of range$/', $error, $match);
        if ($match) {
            return $stage . ' :: convert6';
        }

        preg_match('/^Attempt to convert NaN value to integer type in \\$convert with no onError value$/', $error, $match);
        if ($match) {
            return $stage . ' :: convert7';
        }

        preg_match('/cannot apply \\$round with precision value ([-0-9]+) value must be in \[-20, 100\]/', $error, $match);
        if ($match) {
            $value = $match[1];
            return $stage . ' :: round2 :: ' . $value;
        }

        preg_match('/^precision argument to  \\$round must be a integral value$/', $error, $match);
        if ($match) {
            return $stage . ' :: round3';
        }

        preg_match('/cannot apply \\$trunc with precision value ([-0-9]+) value must be in \[-20, 100\]/', $error, $match);
        if ($match) {
            $value = $match[1];
            return $stage . ' :: trunc2 :: ' . $value;
        }

        preg_match('/\\$concat only supports strings, not (\w+)/', $error, $match);
        if ($match) {
            $type = self::normalizeMongoType($match[1]);
            return $stage . ' :: fn6 :: join,' . $type;
        }

        preg_match('/^\\$(\w+) only supports arrays, not (\w+)$/', $error, $match);
        if ($match) {
            if ($match[1] === 'concatArrays') $match[1] = 'merge';
            $type = self::normalizeMongoType($match[2]);
            return "$stage :: fn1 :: $match[1],$type";
        }

        preg_match('/Can\'t coerce out of range value (-?inf|nan|[\d.e+\-]+) to long/', $error, $match);
        if ($match) {
            return $stage . ' :: general1';
        }

        preg_match('/Error parsing date string/', $error, $match);
        if ($match) {
            return $stage . ' :: toDate1';
        }

        preg_match('/an incomplete date\/time string has been found, with elements missing/', $error, $match);
        if ($match) {
            return $stage . ' :: toDate1';
        }

        preg_match('/\\$regexMatch needs \'input\' to be of type string/', $error, $match);
        if ($match) {
            return $stage . ' :: fn4 :: regexTest,1st';
        }

        preg_match('/\\$regexMatch needs \'regex\' to be of type string or regex/', $error, $match);
        if ($match) {
            return $stage . ' :: fn4 :: regexTest,2nd';
        }

        preg_match('/\\$regexMatch: regular expression cannot contain an embedded null byte/', $error, $match);
        if ($match) {
            return $stage . ' :: regexTest3';
        }

        preg_match('/Invalid Regex in \\$regexMatch:.+/', $error, $match);
        if ($match) {
            return $stage . ' :: regexTest3';
        }

        preg_match('/\\$regexFind needs \'input\' to be of type string/', $error, $match);
        if ($match) {
            return $stage . ' :: fn4 :: regexMatch,1st';
        }

        preg_match('/\\$regexFind needs \'regex\' to be of type string or regex/', $error, $match);
        if ($match) {
            return $stage . ' :: fn4 :: regexMatch,2nd';
        }

        preg_match('/\\$regexFind: regular expression cannot contain an embedded null byte/', $error, $match);
        if ($match) {
            return $stage . ' :: regexMatch3';
        }

        preg_match('/Invalid Regex in \\$regexFind:.+/', $error, $match);
        if ($match) {
            return $stage . ' :: regexMatch3';
        }

        preg_match('/\\$regexFindAll needs \'input\' to be of type string/', $error, $match);
        if ($match) {
            return $stage . ' :: fn4 :: regexMatchAll,1st';
        }

        preg_match('/\\$regexFindAll needs \'regex\' to be of type string or regex/', $error, $match);
        if ($match) {
            return $stage . ' :: fn4 :: regexMatchAll,2nd';
        }

        preg_match('/\\$regexFindAll: regular expression cannot contain an embedded null byte/', $error, $match);
        if ($match) {
            return $stage . ' :: regexMatchAll3';
        }

        preg_match('/Invalid Regex in \\$regexFindAll:.+/', $error, $match);
        if ($match) {
            return $stage . ' :: regexMatchAll3';
        }

        // Это такой хитрый способ передать название ошибки прямиком из монги, вызвав неправильный $dateFromString.
        // Еще можно было бы использовать $arrayToObject, поскольку эта функция тоже содержимое как есть раскрывает.
        preg_match('/\\$dateFromString requires that \'format\' be a string, found: array with value \["_throw_ (.+)"]/', $error, $match);
        if ($match) {
            $parts = explode(',', $match[1]);

            if (in_array($parts[0], ['add1', 'unique1'])) {
                $parts[1] = self::normalizeMongoType($parts[1]);
            }

            if (in_array($parts[0], ['fn1', 'fn6', 'fn7'])) {
                $parts[2] = self::normalizeMongoType($parts[2]);
            }

            if (in_array($parts[0], ['fn5'])) {
                $parts[3] = self::normalizeMongoType($parts[3]);
            }

            if (in_array($parts[0], ['member1'])) {
                $parts[1] = self::normalizeMongoType($parts[1]);
                $parts[2] = self::normalizeMongoType($parts[2]);
            }

            if (count($parts) === 1) return $stage . ' :: ' . $parts[0];
            else return $stage . ' :: ' . $parts[0] . ' :: ' . implode(',', array_slice($parts, 1));
        }

        return $stage . ' :: unknown :: ' . $error;
    }
}
