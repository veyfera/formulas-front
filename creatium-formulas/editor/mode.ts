import type * as CodeMirror from "codemirror"

import { Expression } from "../typescript/formulas/Expression"

export function defineMode(CM: typeof CodeMirror) {
    if (CM.getMode({}, 'formula').name === 'formula') return;
    else CM.defineMode("formula", function (config, parserConfig) {
        var wordRE = /[\w$\xa1-\uffff]/;
        var operatorRE = /[+\-*&%=<>!\/?]/;

        function tokenBase(stream, state) {
            if (stream.sol()) {
                state.sol = true;
            } else if (stream.pos > stream.indentation()) {
                state.sol = false;
            }

            stream.eatSpace();
            if (stream.current().length) return;

            var ch = stream.next();


            if (ch == '"' || ch == "'") {
                state.tokenize = tokenString(ch);
                return state.tokenize(stream, state);
            }

            if (ch == "/") {
                if (stream.eat("*")) {
                    state.tokenize = tokenComment;
                    return tokenComment(stream, state);
                } else if (stream.eat("/")) {
                    stream.skipToEnd();
                    return "comment";
                } else {
                    let allowRegexLiteral = false;
                    if (state.previousToken === null) allowRegexLiteral = true;
                    else if (state.previousToken === 'operator') allowRegexLiteral = true;
                    else if (state.previousToken === 'comma') allowRegexLiteral = true;
                    else if (state.previousToken === 'parentheses-open') allowRegexLiteral = true;

                    if (allowRegexLiteral) {
                        state.tokenize = tokenString(ch);
                        return state.tokenize(stream, state);
                    }
                }
            }

            if (ch == '#') {
                state.tokenize = tokenDate();
                return state.tokenize(stream, state);
            }

            if (ch === '(' || ch === '[' || ch === '{') {
                return `parentheses-open ${{
                    "(": "parentheses-type-a",
                    "[": "parentheses-type-b",
                    "{": "parentheses-type-c",
                }[ch]}`;
            }

            if (ch === ')' || ch === ']' || ch === '}') {
                return `parentheses-close ${{
                    ")": "parentheses-type-a",
                    "]": "parentheses-type-b",
                    "}": "parentheses-type-c",
                }[ch]}`;
            }

            if (ch == "0" && stream.match(/^(?:x[\dA-Fa-f_]+|o[0-7_]+|b[01_]+)n?/)) {
                return "number";
            }

            if (/\d/.test(ch)) {
                stream.match(/^[\d_]*(?:n|(?:\.[\d_]*)?(?:[eE][+\-]?[\d_]+)?)?/);
                return "number";
            }

            if (operatorRE.test(ch)) {
                stream.eatWhile(operatorRE);
                return "operator";
            }

            if (ch === '@') {
                stream.eatWhile(wordRE);
                return "column";
            }

            if (wordRE.test(ch)) {
                stream.eatWhile(wordRE);
                const word = stream.current();
                stream.eatSpace();

                if (stream.peek() === '(' && Expression.FUNCTIONS[word]) {
                    return "function";
                } else if (Expression.BINARY_OPERATORS[word]) {
                    return "operator";
                } else {
                    return "variable";
                }
            }

            if (ch === ',') {
                return "comma";
            }
        }

        function tokenString(quote) {
            return function (stream, state) {
                var escaped = false, next;
                while (next = stream.next()) {
                    if (next == quote && !escaped) {
                        state.tokenize = tokenBase;
                        break;
                    }
                    escaped = !escaped && next == "\\";
                }
                return "string";
            };
        }

        function tokenDate() {
            return function (stream, state) {
                var next;
                while (next = stream.next()) {
                    if (next == '#') {
                        state.tokenize = tokenBase;
                        break;
                    }
                }
                return "date";
            };
        }

        function tokenComment(stream, state) {
            var maybeEnd = false, next;
            while (next = stream.next()) {
                if (next == "/" && maybeEnd) {
                    state.tokenize = tokenBase;
                    break;
                }
                maybeEnd = next == "*";
            }
            return "comment";
        }

        return {
            startState: function (base?) {
                return {
                    tokenize: tokenBase,
                    previousToken: null,
                    baseIndent: base || 0,
                    level: 0,
                    sol: false,
                    eol: false,
                };
            },

            token: function (stream, state) {
                const style = state.tokenize(stream, state);

                state.eol = stream.eol();

                const current = stream.current();
                if (current === '(' || current === '[' || current === '{') {
                    if (state.eol) state.level++;
                } else if (current === ')' || current === ']' || current === '}') {
                    if (state.sol) state.level--;
                }

                if (style) {
                    state.previousToken = style.split(' ')[0];
                }

                return style;
            },

            indent: function (state, textAfter) {
                let level = state.level;
                if (/^[\}\]\)]/.test(textAfter)) level -= 1;
                return state.baseIndent + level * config.indentUnit;
            },

            electricChars: '}])',
        };
    });
}
