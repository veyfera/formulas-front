<?php

namespace formulas;

const AST_VERSION = 1;

const TAB_CODE = 9;
const LF_CODE = 10;
const CR_CODE = 13;
const SPACE_CODE = 32;
const HASH_CODE = 35;
const FSLSH_CODE = 47; // /
const ASTSK_CODE = 42; // *
const PERIOD_CODE = 46; // .
const COMMA_CODE = 44; // ,
const SQUOTE_CODE = 39; // '
const DQUOTE_CODE = 34; // "
const OPAREN_CODE = 40; // (
const CPAREN_CODE = 41; // )
const SEMCOL_CODE = 59; // ;
const QUESTION_CODE = 63; // ?
const OBRACK_CODE = 91; // [
const CBRACK_CODE = 93; // ]
const COLON_CODE = 58; // :
const OCURLY_CODE = 123; // {
const CCURLY_CODE = 125; // }

function MAX_UNOP_LEN() {
    static $cache = 0;
    if ($cache === 0) {
        $cache = max(0, ...array_map('mb_strlen', array_keys(Expression::$UNARY_OPERATORS)));
    }

    return $cache;
}

function MAX_BINOP_LEN() {
    static $cache = 0;
    if ($cache === 0) {
        $cache = max(0, ...array_map('mb_strlen', array_keys(Expression::$BINARY_OPERATORS)));
    }

    return $cache;
}

/**
 * @param ch a character code in the next three functions
 */
function isDecimalDigit($ch)
{
    return ($ch >= 48 && $ch <= 57); // 0...9
}

/**
 * Returns the precedence of a binary operator or `0` if it isn't a binary operator. Can be float.
 */
function binaryPrecedence($op_val)
{
    if (isset(Expression::$BINARY_OPERATORS[$op_val])) {
        return Expression::$BINARY_OPERATORS[$op_val]::$binaryOperatorPrecedence ?? 0;
    } else {
        return 0;
    }
}

function isRightAssociative($op_val)
{
    if (isset(Expression::$BINARY_OPERATORS[$op_val])) {
        return Expression::$BINARY_OPERATORS[$op_val]::$rightAssociative ?? false;
    } else {
        return false;
    }
}

function isIdentifierStartOrPart($ch)
{
    return ($ch >= 65 && $ch <= 90) || // A...Z
        ($ch >= 97 && $ch <= 122) || // a...z
        in_array(chr($ch), ['$', '_']); // additional characters
}

function isIdentifierStart($ch)
{
    return isIdentifierStartOrPart($ch) || chr($ch) === '@';
}

function isIdentifierPart($ch)
{
    return isIdentifierStartOrPart($ch) || isDecimalDigit($ch);
}

// Highly based on https://github.com/EricSmekens/jsep
class Parser
{
    protected $expr;
    protected $index;

    protected function char($index = null)
    {
        if ($index === null) $index = $this->index;

        if (mb_strlen($this->expr) > $index) {
            return mb_substr($this->expr, $index, 1);
        } else {
            return '';
        }
    }

    protected function code($index = null)
    {
        $char = $this->char($index);
        return $char === '' ? 0 : mb_ord($this->char($index));
    }

    /**
     * @param expr a string with the passed in express
     */
    protected function __construct($expr)
    {
        // `index` stores the character number we are currently at
        // All of the gobbles below will modify `index` as we move along
        $this->expr = $expr;
        $this->index = 0;
    }

    protected function throwError($message, $index = null)
    {
        throw new \Exception($message . ' at character ' . ($index ?? $this->index));
    }

    /**
     * Push `index` up to the next non-space character
     */
    protected function gobbleSpaces()
    {
        $ch = $this->code();
        while ($ch === SPACE_CODE || $ch === TAB_CODE || $ch === LF_CODE || $ch === CR_CODE) {
            $ch = $this->code(++$this->index);
        }

        $this->gobbleComment();
    }

    protected function gobbleComment()
    {
        if ($this->code() === FSLSH_CODE) {
            $ch = $this->code($this->index + 1);
            if ($ch === FSLSH_CODE) {
                // '//': read to end of line/input
                $this->index++;

                while ($ch !== LF_CODE && !is_nan($ch)) {
                    $ch = $this->code(++$this->index);
                }

                $this->gobbleSpaces();
            } else if ($ch === ASTSK_CODE) {
                // read to */ or end of input
                $this->index += 2;

                while (!is_nan($ch)) {
                    $ch = $this->code($this->index++);

                    if ($ch === ASTSK_CODE) {
                        $ch = $this->code($this->index++);

                        if ($ch === FSLSH_CODE) {
                            $this->gobbleSpaces();
                            return;
                        }
                    }
                }

                // missing closing */
                $this->throwError('parse1');
            }
        }
    }

    /**
     * Top-level method to parse all expressions and returns compound or single node
     */
    protected function parse()
    {
        $nodes = $this->gobbleExpressions();

        if (count($nodes) === 0) {
            return null;
        } else if (count($nodes) === 1) {
            return $nodes[0];
        } else {
            $properties = array_map(function ($node) {
                if ($node->type !== 'BinaryExpression' || $node->operator !== '=') {
                    $this->throwError('parse18', $node->location[0]);
                }

                if ($node->left->type !== 'Identifier') {
                    $this->throwError('parse19', $node->left->location[0]);
                }

                return (object)[
                    'key' => $node->left->name,
                    'value' => $node->right,
                    'location' => $node->left->location,
                ];
            }, array_slice($nodes, 0, count($nodes) - 1));

            return (object)[
                'type' => 'CallExpression',
                'arguments' => [(object)[
                    'type' => 'ObjectExpression',
                    'properties' => $properties,
                    'location' => [0, 0],
                ], end($nodes)],
                'callee' => 'let',
                'location' => [0, 0],
            ];
        }
    }

    /**
     * Top-level parser
     */
    protected function gobbleExpressions()
    {
        $nodes = [];
        while ($this->index < mb_strlen($this->expr)) {
            $node = $this->gobbleExpression();
            if ($node) $nodes[] = $node;

            // Expressions should be separated by semicolons
            if ($this->code() === SEMCOL_CODE) {
                $this->index++;
                continue;
            }

            if ($this->index < mb_strlen($this->expr)) {
                $this->throwError('parse2 :: ' . $this->char());
            }
        }

        return $nodes;
    }

    /**
     * The main parsing function.
     */
    protected function gobbleExpression()
    {
        $node = $this->gobbleBinaryExpression();
        $this->gobbleSpaces();

        return $node;
    }

    /**
     * Search for the operation portion of the string (e.g. `+`, `===`)
     * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
     * and move down from 3 to 2 to 1 character until a matching binary operation is found
     * then, return that binary operation
     */
    protected function gobbleBinaryOp()
    {
        $this->gobbleSpaces();

        $to_check = mb_substr($this->expr, $this->index, MAX_BINOP_LEN());
        $tc_len = mb_strlen($to_check);

        while ($tc_len > 0) {
            $exists = array_key_exists($to_check, Expression::$BINARY_OPERATORS) || $to_check == '=';

            // Don't accept a binary op when it is an identifier.
            // Binary ops that start with an identifier-valid character must be followed
            // by a non identifier-part valid character
            if ($exists && (
                !isIdentifierStart($this->code($this->index)) ||
                ($this->index + mb_strlen($to_check) < mb_strlen($this->expr) && !isIdentifierPart($this->code($this->index + mb_strlen($to_check))))
            )) {
                $this->index += $tc_len;
                return $to_check;
            }

            $to_check = mb_substr($to_check, 0, --$tc_len);
        }

        return false;
    }

    /**
     * This function is responsible for gobbling an individual expression,
     * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
     */
    protected function gobbleBinaryExpression()
    {
        $left = $this->gobbleToken();
        if (!$left) {
            return $left;
        }

        $biop = $this->gobbleBinaryOp();

        // If there wasn't a binary operator, just return the leftmost node
        if (!$biop) {
            return $left;
        }

        // Otherwise, we need to start a stack to properly place the binary operations in their
        // precedence structure
        $biop_info = (object)[
            'value' => $biop,
            'prec' => binaryPrecedence($biop),
            'location' => [$this->index - mb_strlen($biop), $this->index],
            'right_a' => isRightAssociative($biop),
        ];

        $right = $this->gobbleToken();

        if (!$right) {
            $this->throwError("parse3 :: " . $biop);
        }

        $stack = [$left, $biop_info, $right];

        // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
        while ($biop = $this->gobbleBinaryOp()) {
            $prec = binaryPrecedence($biop);

            $biop_info = (object)[
                'value' => $biop,
                'prec' => $prec,
                'location' => [$this->index - mb_strlen($biop), $this->index],
                'right_a' => isRightAssociative($biop),
            ];
            $cur_biop = $biop;

            // Reduce: make a binary expression from the three topmost entries.
            $comparePrev = function($p) use ($biop_info, $prec) {
                return $biop_info->right_a && $p->right_a ? $prec > $p->prec : $prec <= $p->prec;
            };

            while (count($stack) > 2 && $comparePrev($stack[count($stack) - 2])) {
                $right = array_pop($stack);
                $biop_info2 = array_pop($stack);
                $left = array_pop($stack);

                $stack[] = (object)[
                    'type' => 'BinaryExpression',
                    'operator' => $biop_info2->value,
                    'left' => $left,
                    'right' => $right,
                    'location' => $biop_info2->location,
                ];
            }

            $node = $this->gobbleToken();

            if (!$node) {
                $this->throwError("parse3 :: " . $cur_biop);
            }

            $stack[] = $biop_info;
            $stack[] = $node;
        }

        $i = count($stack) - 1;
        $node = $stack[$i];

        while ($i > 1) {
            $node = (object)[
                'type' => 'BinaryExpression',
                'operator' => $stack[$i - 1]->value,
                'left' => $stack[$i - 2],
                'right' => $node,
                'location' => $stack[$i - 1]->location,
            ];
            $i -= 2;
        }

        return $node;
    }

    /**
     * An individual part of a binary expression:
     * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
     */
    protected function gobbleToken()
    {
        $this->gobbleSpaces();

        $ch = $this->code();

        $node = null;
        if (isDecimalDigit($ch)) {
            $node = $this->gobbleNumericLiteral();
        } else if ($ch === SQUOTE_CODE || $ch === DQUOTE_CODE || $ch === FSLSH_CODE) {
            $node = $this->gobbleStringLiteral();
        } else if ($ch === HASH_CODE) {
            $node = $this->gobbleDateLiteral();
        } else if ($ch === OBRACK_CODE) {
            $node = $this->gobbleArray();
        } else if ($ch === OCURLY_CODE) {
            $node = $this->gobbleObjectExpression();
        } else {
            $to_check = mb_substr($this->expr, $this->index, MAX_UNOP_LEN());
            $tc_len = mb_strlen($to_check);

            while ($tc_len > 0) {
                // Don't accept an unary op when it is an identifier.
                // Unary ops that start with a identifier-valid character must be followed
                // by a non identifier-part valid character
                if (array_key_exists($to_check, Expression::$UNARY_OPERATORS) && (
                    !isIdentifierStart($this->code()) ||
                    ($this->index + mb_strlen($to_check) < mb_strlen($this->expr) && !isIdentifierPart($this->code($this->index + mb_strlen($to_check))))
                )) {
                    $this->index += $tc_len;

                    $location = [$this->index - $tc_len, $this->index];

                    $argument = $this->gobbleToken();

                    if (!$argument) {
                        $this->throwError('parse4');
                    }

                    return (object)[
                        'type' => 'UnaryExpression',
                        'operator' => $to_check,
                        'argument' => $argument,
                        'location' => $location,
                    ];
                }

                $to_check = mb_substr($to_check, 0, --$tc_len);
            }

            if (isIdentifierStart($ch)) {
                $node = $this->gobbleIdentifier();

                if ($node->name === 'true' || $node->name === 'false') {
                    $node = (object)[
                        'type' => 'Boolean',
                        'value' => $node->name === 'true',
                        'location' => $node->location,
                    ];
                } else if ($node->name === 'null') {
                    $node = (object)[
                        'type' => 'Null',
                        'location' => $node->location,
                    ];
                } else if ($node->name === 'Infinity') {
                    $node = (object)[
                        'type' => 'Number',
                        'value' => 'Infinity',
                        'location' => $node->location,
                    ];
                } else if ($node->name === 'NaN') {
                    $node = (object)[
                        'type' => 'Number',
                        'value' => 'NaN',
                        'location' => $node->location,
                    ];
                }
            } else if ($ch === OPAREN_CODE) {
                $node = $this->gobbleGroup() ?? $node;
            }
        }

        return $this->gobbleTokenProperty($node);
    }

    /**
     * Gobble properties of identifiers/strings/arrays/groups.
     * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
     * It also gobbles function calls: foo(bar)
     */
    protected function gobbleTokenProperty($node)
    {
        $this->gobbleSpaces();

        $ch = $this->code();
        while ($ch === PERIOD_CODE || $ch === OBRACK_CODE || $ch === OPAREN_CODE) {
            if (!$node) {
                // That can be after gobbleGroup, which can return undefined in case `()`
                $this->throwError('parse2 :: ' . $this->char());
            }

            $this->index++;

            if ($ch === OBRACK_CODE) {
                $property = $this->gobbleExpression();

                $this->gobbleSpaces();
                $ch = $this->code();
                if ($ch !== CBRACK_CODE) {
                    $this->throwError('parse8 :: [');
                }

                if (!$property) {
                    $this->throwError('parse2 :: ' . $this->char());
                }

                $this->index++;

                $node = (object)[
                    'type' => 'MemberExpression',
                    'object' => $node,
                    'property' => $property,
                    'location' => [$node->location[0], $this->index],
                ];
            } else if ($ch === PERIOD_CODE) {
                $this->gobbleSpaces();

                $property = $this->gobbleIdentifier();
                $node = (object)[
                    'type' => 'MemberExpression',
                    'object' => $node,
                    'property' => (object)[
                        'type' => 'String',
                        'value' => $property->name,
                        'location' => $property->location,
                    ],
                    'location' => [$node->location[0], $property->location[1]],
                ];
            } else if ($ch === OPAREN_CODE) {
                if ($node->type === 'Identifier') {
                    if (!isset(Expression::$FUNCTIONS[$node->name])) {
                        $this->throwError('parse14 :: ' . $node->name);
                    }

                    $node = (object)[
                        'type' => 'CallExpression',
                        'arguments' => $this->gobbleArguments(CPAREN_CODE),
                        'callee' => $node->name,
                        'location' => $node->location,
                    ];
                } else {
                    if ($node->type === 'MemberExpression' && $node->property->type === 'String') {
                        if (!isset(Expression::$FUNCTIONS[$node->property->value])) {
                            $this->throwError('parse14 :: ' . $node->property->value);
                        }

                        $node = (object)[
                            'type' => 'CallExpression',
                            'arguments' => array_merge(
                                [$node->object],
                                $this->gobbleArguments(CPAREN_CODE)
                            ),
                            'callee' => $node->property->value,
                            'location' => $node->property->location,
                        ];
                    } else {
                        $this->throwError('parse13');
                    }
                }
            }

            $this->gobbleSpaces();
            $ch = $this->code();
        }

        if ($ch === QUESTION_CODE) {
            if ($this->code($this->index + 1) !== QUESTION_CODE) {
                $this->index++;

                $node = (object)[
                    'type' => 'UnaryExpression',
                    'operator' => '?',
                    'argument' => $node,
                    'location' => [$this->index - 1, $this->index],
                ];
            }
        }

        return $node;
    }

    /**
     * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
     * keep track of everything in the numeric literal and then calling `parseFloat` on that string
     */
    protected function gobbleNumericLiteral()
    {
        $number = '';
        $start = $this->index;

        while (isDecimalDigit($this->code())) {
            $number .= $this->char($this->index++);
        }

        if ($this->code() === PERIOD_CODE) {
            $number .= $this->char($this->index++);

            while (isDecimalDigit($this->code())) {
                $number .= $this->char($this->index++);
            }
        }

        $ch = $this->char();

        if ($ch === 'e' || $ch === 'E') { // exponent marker
            $number .= $this->char($this->index++);
            $ch = $this->char();

            if ($ch === '+' || $ch === '-') { // exponent sign
                $number .= $this->char($this->index++);
            }

            while (isDecimalDigit($this->code())) { // exponent itself
                $number .= $this->char($this->index++);
            }

            if (!isDecimalDigit($this->code($this->index - 1))) {
                $this->throwError('parse15 :: ' . $number . $this->char());
            }
        }

        $chCode = $this->code();

        // Check to make sure this isn't a variable name that start with a number (123abc)
        if (isIdentifierStart($chCode)) {
            $this->throwError('parse6 :: ' . $number . $this->char());
        } else if ($chCode === PERIOD_CODE || (mb_strlen($number) === 1 && mb_ord($number[0]) === PERIOD_CODE)) {
            $this->throwError('parse2 :: .');
        }

        $value = floatval($number);
        if ($value > PHP_FLOAT_MAX) {
            $this->throwError('parse7');
        }

        return (object)[
            'type' => 'Number',
            'value' => $value,
            'location' => [$start, $this->index],
        ];
    }

    /**
     * Parses a string literal, staring with single or double quotes with basic support for escape codes
     * e.g. `"hello world"`, `'this is\nJSEP'`
     */
    protected function gobbleStringLiteral()
    {
        $str = '';
        $start = $this->index;
        $quote = $this->char($this->index++);
        $closed = false;

        while ($this->index < mb_strlen($this->expr)) {
            $ch = $this->char($this->index++);

            if ($ch === $quote) {
                $closed = true;
                break;
            } else if ($ch === '\\') {
                // Check for all the common escape codes
                $ch = $this->char($this->index++);

                if ($quote === '/') {
                    $str .= '\\' . $ch;
                } else {
                    switch ($ch) {
                        case 'n':
                            $str .= "\n";
                            break;
                        case 'r':
                            $str .= "\r";
                            break;
                        case 't':
                            $str .= "\t";
                            break;
                        case 'b':
                            $str .= "\x08";
                            break;
                        case 'f':
                            $str .= "\f";
                            break;
                        case 'v':
                            $str .= "\x0B";
                            break;
                        default :
                            $str .= $ch;
                    }
                }
            } else {
                $str .= $ch;
            }
        }

        if (!$closed) {
            $this->throwError('parse16 :: ' . $str);
        }

        return (object)[
            'type' => 'String',
            'value' => $str,
            'location' => [$start, $this->index],
        ];
    }

    /**
     * Parses a date literal, wrapped by #
     * e.g. `#2022-07-02T13:38:47.700Z#`, `#2020-01-01 00:00:00#`
     */
    protected function gobbleDateLiteral()
    {
        $start = $this->index;
        $end = mb_strpos($this->expr, '#', $this->index + 1) + 1;

        $str = mb_substr($this->expr, $start + 1, $end - $start - 2);

        try {
            $date = Convertation::toDate($str);
        } catch (\Throwable $e) {
            $this->throwError('parse17');
        }

        $this->index = $end;

        return (object)[
            'type' => 'Date',
            'value' => Convertation::toString($date),
            'location' => [$start, $end],
        ];
    }

    /**
     * Gobbles only identifiers
     * e.g.: `foo`, `_value`, `$x1`
     * Also, this function checks if that identifier is a literal:
     * (e.g. `true`, `false`, `null`) or `this`
     */
    protected function gobbleIdentifier()
    {
        $ch = $this->code();
        $start = $this->index;

        if (isIdentifierStart($ch)) {
            $this->index++;
        } else {
            $this->throwError('parse2 :: ' . $this->char());
        }

        while ($this->index < mb_strlen($this->expr)) {
            $ch = $this->code();

            if (isIdentifierPart($ch)) {
                $this->index++;
            } else {
                break;
            }
        }

        $name = mb_substr($this->expr, $start, $this->index - $start);

        if ($name[0] === '@') {
            return (object)[
                'type' => 'Identifier',
                'column' => true,
                'name' => mb_substr($name, 1),
                'location' => [$start, $this->index],
            ];
        } else {
            return (object)[
                'type' => 'Identifier',
                'column' => false,
                'name' => $name,
                'location' => [$start, $this->index],
            ];
        }
    }

    /**
     * Gobbles a list of arguments within the context of a function call
     * or array literal. This function also assumes that the opening character
     * `(` or `[` has already been gobbled, and gobbles expressions and commas
     * until the terminator character `)` or `]` is encountered.
     * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
     */
    protected function gobbleArguments($termination)
    {
        $args = [];
        $closed = false;
        $separator_count = 0;

        while ($this->index < mb_strlen($this->expr)) {
            $this->gobbleSpaces();
            $ch_i = $this->code();

            if ($ch_i === $termination) { // done parsing
                $closed = true;
                $this->index++;

                if ($termination === CPAREN_CODE && $separator_count && $separator_count >= count($args)) {
                    $this->throwError('parse2 :: ' . chr($termination));
                }

                break;
            } else if ($ch_i === COMMA_CODE) { // between expressions
                $this->index++;
                $separator_count++;

                if ($separator_count !== count($args)) { // missing argument
                    $this->throwError('parse2 :: ,');
                }
            } else if (count($args) !== $separator_count) {
                $this->throwError('parse5 :: ,');
            } else {
                $node = $this->gobbleExpression();

                if (!$node) {
                    $this->throwError('parse5 :: ,');
                }

                $args[] = $node;
            }
        }

        if (!$closed) {
            $this->throwError('parse5 :: ' . chr($termination));
        }

        return $args;
    }

    /**
     * Responsible for parsing expression within parentheses `()`
     * that have no identifier in front (so not a function call)
     */
    protected function gobbleGroup()
    {
        $this->index++;

        $node = $this->gobbleExpression();

        if ($this->code() === CPAREN_CODE) {
            $this->index++;
            return $node;
        } else {
            $this->throwError('parse8 :: (');
        }
    }

    /**
     * Responsible for parsing Array literals `[1, 2, 3]`
     * This function assumes that it needs to gobble the opening bracket
     * and then tries to gobble the expressions as arguments.
     */
    protected function gobbleArray()
    {
        $start = $this->index;

        $this->index++;

        $elements = $this->gobbleArguments(CBRACK_CODE);

        return (object)[
            'type' => 'ArrayExpression',
            'elements' => $elements,
            'location' => [$start, $this->index],
        ];
    }

    /**
     * Responsible for parsing Object literals `{x: 1, "y": 2}`
     */
    protected function gobbleObjectExpression()
    {
        $start = $this->index;

        $this->index++;
        $properties = [];
        $closed = false;

        while (!is_nan($this->code())) {
            $this->gobbleSpaces();
            if ($this->code() === CCURLY_CODE) {
                $this->index++;
                $closed = true;
                break;
            }

            if (count($properties)) {
                if ($this->code() === COMMA_CODE) {
                    $this->index++;

                    // } after trailing ,
                    $this->gobbleSpaces();
                    if ($this->code() === CCURLY_CODE) {
                        $this->index++;
                        $closed = true;
                        break;
                    }
                } else {
                    $this->throwError('parse9 :: ,');
                }
            }

            $key = $this->gobbleExpression();
            if (!$key) break;  // missing }

            $keyName = $keyLocation = $key->location;
            if ($key->type === 'Identifier') {
                $keyName = $key->name;
            } else if ($key->type === 'String') {
                $keyName = $key->value;
            } else if ($key->type === 'Null') {
                $keyName = 'null';
            } else {
                $this->throwError('parse10');
            }

            $this->gobbleSpaces();
            if ($this->code() === COLON_CODE) {
                $this->index++;
                $value = $this->gobbleExpression();

                if (!$value) {
                    $this->throwError('parse11');
                }

                $properties[] = (object)[
                    'key' => $keyName,
                    'value' => $value,
                    'location' => $keyLocation,
                ];

                $this->gobbleSpaces();
            } else {
                $this->throwError('parse12');
            }
        }

        if ($closed) {
            return $this->gobbleTokenProperty((object)[
                'type' => 'ObjectExpression',
                'properties' => $properties,
                'location' => [$start, $this->index],
            ]);
        } else {
            $this->throwError('parse9 :: }');
        }
    }

    static function parseExpression($code)
    {
        try {
            return (object)[
                'version' => AST_VERSION,
                'code' => $code,
                'source' => (new Parser($code))->parse(),
                'error' => null,
            ];
        } catch (\Throwable $e) {
            $message = $e->getMessage();
            $character = 0;

            $parts = explode(' at character ', $e->getMessage());
            if (count($parts) > 1) {
                $message = $parts[0];
                $character = (int)$parts[1];
            }

            return (object)[
                'version' => AST_VERSION,
                'code' => $code,
                'source' => null,
                'error' => (object)[
                    'message' => $message,
                    'character' => $character,
                ],
            ];
        }
    }
}