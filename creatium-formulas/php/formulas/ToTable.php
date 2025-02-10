<?php

namespace formulas;

use Exception;

class ToTable
{
    static function perform($data)
    {
        if (Typing::isNull($data)) {
            return (object) [
                'columns' => [],
                'rows' => [],
                'total_count' => 0,
            ];
        } elseif (Typing::isArray($data)) {
            if (count($data) === 0) {
                return (object) [
                    'columns' => [],
                    'rows' => [],
                    'total_count' => 0,
                ];
            } else {
                $keys = null;
                $rows = [];
                foreach ($data as $rawRow) {
                    if (!Typing::isObject($rawRow)) {
                        throw new Exception('toTable2 :: ' . Typing::getType($rawRow));
                    }

                    if ($keys === null) {
                        $keys = array_keys((array) $rawRow);
                    }

                    $row = (object) [];
                    foreach ($keys as $key) {
                        $row->$key = $rawRow->$key ?? null;
                    }
                    $rows[] = $row;
                }

                return (object) [
                    'columns' => array_map(
                        fn($key) => (object) ['id' => $key, 'name' => $key, 'type' => 'any'],
                        $keys
                    ),
                    'rows' => $rows,
                    'total_count' => count($data),
                ];
            }
        } else {
            throw new Exception('toTable1 :: ' . Typing::getType($data));
        }
    }
}