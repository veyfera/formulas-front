<?php

namespace formulas\functions\text;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class TrimFunction extends AbstractFunction
{
    protected int $minArguments = 1;
    protected int $maxArguments = 1;

    // https://mongodb.com/docs/manual/reference/operator/aggregation/trim/#std-label-trim-white-space
    static $WHITESPACE = (
        "\u{0000}\u{0020}\u{0009}\u{000A}\u{000B}" .
        "\u{000C}\u{000D}\u{00A0}\u{1680}\u{2000}" .
        "\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}" .
        "\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}"
    );

    // https://github.com/vuoriliikaluoma/mb_trim/blob/old-php54/mb_trim.php
    /**
     * mb_trim
     *
     * Strip whitespace (or other characters) from the beginning and end of a string.
     *
     * @param string $str The string that will be trimmed.
     * @param string $charlist Optionally, the stripped characters can also be specified using the charlist parameter. Simply list all characters that you want to be stripped. With .. you can specify a range of characters.
     * @param string $encoding The encoding parameter is the character encoding. If it is omitted, the internal character encoding value will be used.
     * @return string The trimmed string.
     */
    function mb_trim($str, $charlist = NULL, $encoding = NULL)
    {
        if ($encoding === NULL) {
            $encoding = mb_internal_encoding(); // Get internal encoding when not specified.
        }
        if ($charlist === NULL) {
            $charlist = "\\x{20}\\x{9}\\x{A}\\x{D}\\x{0}\\x{B}"; // Standard charlist, same as trim.
        } else {
            $chars = preg_split('//u', $charlist, -1, PREG_SPLIT_NO_EMPTY); // Splits the string into an array, character by character.
            foreach ($chars as $c => &$char) {
                if (preg_match('/^\x{2E}$/u', $char) && preg_match('/^\x{2E}$/u', $chars[$c + 1])) { // Check for character ranges.
                    $ch1 = hexdec(substr($chars[$c - 1], 3, -1));
                    $ch2 = (int)substr(mb_encode_numericentity($chars[$c + 2], [0x0, 0x10ffff, 0, 0x10ffff], $encoding), 2, -1);
                    $chs = '';
                    for ($i = $ch1; $i <= $ch2; $i++) { // Loop through characters in Unicode order.
                        $chs .= "\\x{" . dechex($i) . "}";
                    }
                    unset($chars[$c], $chars[$c + 1], $chars[$c + 2]); // Unset the now pointless values.
                    $chars[$c - 1] = $chs; // Set the range.
                } else {
                    $char = "\\x{" . dechex(substr(mb_encode_numericentity($char, [0x0, 0x10ffff, 0, 0x10ffff], $encoding), 2, -1)) . "}"; // Convert the character to it's unicode codepoint in \x{##} format.
                }
            }
            $charlist = implode('', $chars); // Return the array to string type.
        }
        $pattern = '/(^[' . $charlist . ']+)|([' . $charlist . ']+$)/u'; // Define the pattern.
        return preg_replace($pattern, '', $str); // Return the trimmed value.
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $input = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($input)) {
            return null;
        } elseif (Typing::isString($input)) {
            return self::mb_trim($input, self::$WHITESPACE);
        } else {
            throw new Exception('fn6 :: trim,' . Typing::getType($input));
        }
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$trim' => [
                'input' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
            ],
        ];
    }
}