<?php

namespace formulas;

use DateTime;
use Exception;

class Convertation
{
    public static function toBoolean($value): bool
    {
        if (Typing::isBoolean($value)) return $value;
        elseif (Typing::isNumber($value)) return !Typing::isZero($value);
        elseif (Typing::isString($value)) return $value !== "";
        elseif (Typing::isObject($value)) return true;
        elseif (Typing::isArray($value)) return true;
        elseif (Typing::isDate($value)) return true;
        else return false; // null
    }

    public static function toNumber($value): ?float
    {
        if (Typing::isString($value)) {
            if ($value === '') throw new Exception('convert4');
            elseif (strtolower($value) === '+infinity' || strtolower($value) === 'infinity') {
                return INF;
            } elseif (strtolower($value) === '+inf' || strtolower($value) === 'inf') {
                return INF;
            } elseif (strtolower($value) === '-infinity' || strtolower($value) === '-inf') {
                return -INF;
            } elseif (strtolower($value) === 'nan') {
                return NAN;
            } else {
                preg_match('/^[+-]?\d+\.?\d*(e[+-]?\d+)?$/i', $value, $match);
                if (count($match)) {
                    $result = floatval($value);
                    if (abs($result) > Typing::$DOUBLE_RANGE) throw new Exception('convert6');
                    else return $result;
                }
                else throw new Exception('convert5');
            }
        }
        elseif (Typing::isBoolean($value)) return $value ? 1 : 0;
        elseif (Typing::isNumber($value)) return $value;
        elseif (Typing::isNull($value)) return 0;
        elseif (Typing::isDate($value)) {
            $milliseconds = $value->format('v');
            return $value->getTimestamp() * 1000 + intval($milliseconds);
        }
        else throw new Exception('convert1 :: ' . Typing::getType($value) . ',number');
    }

    public static function toString($value): ?string
    {
        if (Typing::isString($value)) return $value;
        elseif (Typing::isBoolean($value)) return $value ? 'true' : 'false';
        elseif (Typing::isNumber($value)) {
            if ($value === INF) return 'Infinity';
            if ($value === -INF) return '-Infinity';
            if (Typing::isNaN($value)) return 'NaN';

            if (round($value) === floatval($value) && abs($value) <= Typing::$MONGO_LONG_MAX) {
                return number_format($value, 0, '.', '');
            } else {
                // Используем strtolower потому что буква "E" может встретиться
                return strtolower(strval($value));
            }
        }
        elseif (Typing::isNull($value)) return '';
        elseif (Typing::isDate($value)) {
            $zone = str_replace('+00:00', 'Z', $value->format('P'));

            $year = $value->format('Y');
            if (strlen($year) > 4 || $year[0] === '-') {
                throw new Exception('convert2 :: ' . intval($year));
            }

            return $year . $value->format('-m-d\TH:i:s.v') . $zone;
        }
        else throw new Exception('convert1 :: ' . Typing::getType($value) . ',string');
    }

    static function toDate($value)
    {
        if (Typing::isDate($value)) {
            return $value;
        } elseif (Typing::isNumber($value)) {
            if (Typing::isNaN($value)) {
                throw new Exception("convert7");
            }

            if (abs($value) > Typing::$TIMESTAMP_RANGE) {
                throw new Exception("toDate1");
            }

            $seconds = floor($value / 1000);
            $date = (new DateTime())->setTimestamp($seconds);

            $milliseconds = floor($value - $seconds * 1000);
            if ($milliseconds > 0) {
                $date->modify('+ ' . $milliseconds . ' milliseconds');
            }

            return $date;
        } elseif (Typing::isNull($value)) {
            return null;
        } elseif (Typing::isString($value)) {
            if (preg_match('/' . Typing::ISO8601_PATTERN() . '/', $value)) {
                preg_match('/^\d\d\d\d-\d\d-\d\d/', $value, $fulldate);
                if ($fulldate) {
                    $parts = explode('-', $fulldate[0]);
                    $year1 = $parts[0] * 1;
                    $month1 = $parts[1] * 1;
                    $day1 = $parts[2] * 1;
                    $date2 = new DateTime("$year1-$month1-$day1");
                    $year2 = $date2->format('Y') * 1;
                    $month2 = $date2->format('m') * 1;
                    $day2 = $date2->format('d') * 1;
                    if ($year1 !== $year2 || $month1 !== $month2 || $day1 !== $day2) {
                        // Автоматические смещения (с 2000-02-30 на 2000-03-02) не поддерживаем
                        throw new Exception("toDate1");
                    }
                }

                try {
                    return new DateTime($value);
                } catch (Exception $e) {
                    throw new Exception('toDate1');
                }
            } else {
                throw new Exception('toDate1');
            }
        } else throw new Exception('convert1 :: ' . Typing::getType($value) . ',date');
    }
}