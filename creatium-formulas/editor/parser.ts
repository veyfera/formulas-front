import { Expression } from "../typescript/formulas/Expression"
import { AstNode, AstIdentifier, ExpressionAst, AstBinaryExpression } from "../typescript/formulas/tsd"
import { Convertation } from "../typescript/formulas/Convertation.js"

const AST_VERSION = 1;

const TAB_CODE      = 9;
const LF_CODE       = 10;
const CR_CODE       = 13;
const SPACE_CODE    = 32;
const HASH_CODE     = 35;
const FSLSH_CODE    = 47; // /
const ASTSK_CODE    = 42; // *
const PERIOD_CODE   = 46; // .
const COMMA_CODE    = 44; // ,
const SQUOTE_CODE   = 39; // '
const DQUOTE_CODE   = 34; // "
const OPAREN_CODE   = 40; // (
const CPAREN_CODE   = 41; // )
const SEMCOL_CODE   = 59; // ;
const QUESTION_CODE = 63; // ?
const OBRACK_CODE   = 91; // [
const CBRACK_CODE   = 93; // ]
const COLON_CODE    = 58; // :
const OCURLY_CODE   = 123; // {
const CCURLY_CODE   = 125; // }

const MAX_UNOP_LEN = Math.max(0, ...Object.keys(Expression.UNARY_OPERATORS).map(k => k.length));
const MAX_BINOP_LEN = Math.max(0, ...Object.keys(Expression.BINARY_OPERATORS).map(k => k.length));

/**
 * @param ch a character code in the next three functions
 */
function isDecimalDigit(ch: number): boolean {
	return (ch >= 48 && ch <= 57); // 0...9
}

/**
 * Returns the precedence of a binary operator or `0` if it isn't a binary operator. Can be float.
 */
function binaryPrecedence(op_val: string): number {
	return Expression.BINARY_OPERATORS[op_val]?.binaryOperatorPrecedence || 0;
}

function isRightAssociative(op_val: string): boolean {
	return Expression.BINARY_OPERATORS[op_val]?.rightAssociative || false;
}

function isIdentifierStartOrPart(ch: number): boolean {
	return  (ch >= 65 && ch <= 90) || // A...Z
		(ch >= 97 && ch <= 122) || // a...z
		(['$', '_'].includes(String.fromCharCode(ch))); // additional characters
}

function isIdentifierStart(ch: number): boolean {
	return isIdentifierStartOrPart(ch) || String.fromCharCode(ch) === '@';
}

function isIdentifierPart(ch: number) {
	return isIdentifierStartOrPart(ch) || isDecimalDigit(ch);
}

// Highly based on https://github.com/EricSmekens/jsep
class Jsep {
	expr: string
	index: number

	get char() {
		return this.expr.charAt(this.index);
	}

	get code() {
		return this.expr.charCodeAt(this.index);
	};

	/**
	 * @param expr a string with the passed in express
	 */
	constructor(expr: string) {
		// `index` stores the character number we are currently at
		// All of the gobbles below will modify `index` as we move along
		this.expr = expr;
		this.index = 0;
	}

	throwError(message: string, index?: number) {
		throw new Error(message + ' at character ' + (index ?? this.index));
	}

	/**
	 * Push `index` up to the next non-space character
	 */
	gobbleSpaces() {
		let ch = this.code;
		while (ch === SPACE_CODE || ch === TAB_CODE || ch === LF_CODE || ch === CR_CODE) {
			ch = this.expr.charCodeAt(++this.index);
		}

		this.gobbleComment();
	}

	gobbleComment() {
		if (this.code === FSLSH_CODE) {
			let ch = this.expr.charCodeAt(this.index + 1);
			if (ch === FSLSH_CODE) {
				// '//': read to end of line/input
				this.index++;

				while (ch !== LF_CODE && !isNaN(ch)) {
					ch = this.expr.charCodeAt(++this.index);
				}

				this.gobbleSpaces();
			} else if (ch === ASTSK_CODE) {
				// read to */ or end of input
				this.index += 2;

				while (!isNaN(ch)) {
					ch = this.expr.charCodeAt(this.index++);

					if (ch === ASTSK_CODE) {
						ch = this.expr.charCodeAt(this.index++);

						if (ch === FSLSH_CODE) {
							this.gobbleSpaces();
							return;
						}
					}
				}

				// missing closing */
				this.throwError('parse1');
			}
		}
	}

	/**
	 * Top-level method to parse all expressions and returns compound or single node
	 */
	parse(): null|AstNode {
		const nodes = this.gobbleExpressions();

		if (nodes.length === 0) {
			return null;
		} else if (nodes.length === 1) {
			return nodes[0];
		} else {
			const properties = nodes.slice(0, nodes.length - 1).map(node => {
				if (node.type !== 'BinaryExpression' || node.operator !== '=') {
					this.throwError('parse18', node.location[0]);
				}

				node = node as AstBinaryExpression;

				if (node.left.type !== 'Identifier') {
					this.throwError('parse19', node.left.location[0]);
				}

				node.left = node.left as AstIdentifier;

				return {
					key: node.left.name,
					value: node.right,
					location: node.left.location,
				}
			});

			return {
				type: 'CallExpression',
				arguments: [{
					type: 'ObjectExpression',
					properties: properties,
					location: [0, 0],
				}, nodes[nodes.length - 1]],
				callee: 'let',
				location: [0, 0],
			}
		}
	}

	/**
	 * Top-level parser
	 */
	gobbleExpressions(): AstNode[] {
		let nodes = [], node;

		while (this.index < this.expr.length) {
			node = this.gobbleExpression();
			if (node) nodes.push(node);

			// Expressions should be separated by semicolons
			if (this.code === SEMCOL_CODE) {
				this.index++;
				continue;
			}

			if (this.index < this.expr.length) {
				this.throwError('parse2 :: ' + this.char);
			}
		}

		return nodes;
	}

	/**
	 * The main parsing function.
	 */
	gobbleExpression(): AstNode {
		const node = this.gobbleBinaryExpression();
		this.gobbleSpaces();

		return node;
	}

	/**
	 * Search for the operation portion of the string (e.g. `+`, `===`)
	 * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
	 * and move down from 3 to 2 to 1 character until a matching binary operation is found
	 * then, return that binary operation
	 */
	gobbleBinaryOp(): false|string {
		this.gobbleSpaces();

		let to_check = this.expr.substr(this.index, MAX_BINOP_LEN);
		let tc_len = to_check.length;

		while (tc_len > 0) {
			const exists = Expression.BINARY_OPERATORS.hasOwnProperty(to_check) || to_check == '=';

			// Don't accept a binary op when it is an identifier.
			// Binary ops that start with a identifier-valid character must be followed
			// by a non identifier-part valid character
			if (exists && (
				!isIdentifierStart(this.code) ||
				(this.index + to_check.length < this.expr.length && !isIdentifierPart(this.expr.charCodeAt(this.index + to_check.length)))
			)) {
				this.index += tc_len;
				return to_check;
			}

			to_check = to_check.substr(0, --tc_len);
		}

		return false;
	}

	/**
	 * This function is responsible for gobbling an individual expression,
	 * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
	 */
	gobbleBinaryExpression(): AstNode {
		let node, biop, prec, stack, biop_info, right, i, cur_biop;

		// First, try to get the leftmost thing
		// Then, check to see if there's a binary operator operating on that leftmost thing
		// Don't gobbleBinaryOp without a left-hand-side
		const left = this.gobbleToken();
		if (!left) {
			return left;
		}

		biop = this.gobbleBinaryOp();

		// If there wasn't a binary operator, just return the leftmost node
		if (!biop) {
			return left;
		}

		// Otherwise, we need to start a stack to properly place the binary operations in their
		// precedence structure
		biop_info = {
			value: biop,
			prec: binaryPrecedence(biop),
			location: [this.index - biop.length, this.index],
			right_a: isRightAssociative(biop),
		};

		right = this.gobbleToken();

		if (!right) {
			this.throwError("parse3 :: " + biop);
		}

		stack = [left, biop_info, right];

		// Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
		while ((biop = this.gobbleBinaryOp())) {
			prec = binaryPrecedence(biop);

			biop_info = {
				value: biop,
				prec,
				location: [this.index - biop.length, this.index],
				right_a: isRightAssociative(biop),
			};

			cur_biop = biop;

			// Reduce: make a binary expression from the three topmost entries.
			const comparePrev = p => biop_info.right_a && p.right_a ? prec > p.prec : prec <= p.prec;
			while ((stack.length > 2) && comparePrev(stack[stack.length - 2])) {
				const right = stack.pop();
				const biop_info2 = stack.pop();
				const left = stack.pop();

				stack.push({
					type: 'BinaryExpression',
					operator: biop_info2.value,
					left,
					right,
					location: biop_info2.location,
				});
			}

			node = this.gobbleToken();

			if (!node) {
				this.throwError("parse3 :: " + cur_biop);
			}

			stack.push(biop_info, node);
		}

		i = stack.length - 1;
		node = stack[i];

		while (i > 1) {
			node = {
				type: 'BinaryExpression',
				operator: stack[i - 1].value,
				left: stack[i - 2],
				right: node,
				location: stack[i - 1].location,
			};
			i -= 2;
		}

		return node;
	}

	/**
	 * An individual part of a binary expression:
	 * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
	 */
	gobbleToken(): AstNode {
		this.gobbleSpaces();

		const ch = this.code;

		let node;
		if (isDecimalDigit(ch)) {
			node = this.gobbleNumericLiteral();
		} else if (ch === SQUOTE_CODE || ch === DQUOTE_CODE || ch === FSLSH_CODE) {
			node = this.gobbleStringLiteral();
		} else if (ch === HASH_CODE) {
			node = this.gobbleDateLiteral();
		} else if (ch === OBRACK_CODE) {
			node = this.gobbleArray();
		} else if (ch === OCURLY_CODE) {
			node = this.gobbleObjectExpression();
		} else {
			let to_check = this.expr.substr(this.index, MAX_UNOP_LEN);
			let tc_len = to_check.length;

			while (tc_len > 0) {
				// Don't accept an unary op when it is an identifier.
				// Unary ops that start with a identifier-valid character must be followed
				// by a non identifier-part valid character
				if (Expression.UNARY_OPERATORS.hasOwnProperty(to_check) && (
					!isIdentifierStart(this.code) ||
					(this.index + to_check.length < this.expr.length && !isIdentifierPart(this.expr.charCodeAt(this.index + to_check.length)))
				)) {
					this.index += tc_len;

					const location: [number, number] = [this.index - tc_len, this.index];

					const argument = this.gobbleToken();

					if (!argument) {
						this.throwError('parse4');
					}

					return {
						type: 'UnaryExpression',
						operator: to_check,
						argument,
						location,
					};
				}

				to_check = to_check.substr(0, --tc_len);
			}

			if (isIdentifierStart(ch)) {
				node = this.gobbleIdentifier();

				if (node.name === 'true' || node.name === 'false') {
					node = {
						type: 'Boolean',
						value: node.name === 'true',
						location: node.location,
					};
				} else if (node.name === 'null') {
					node = {
						type: 'Null',
						location: node.location,
					};
				} else if (node.name === 'Infinity') {
					node = {
						type: 'Number',
						value: 'Infinity',
						location: node.location,
					};
				} else if (node.name === 'NaN') {
					node = {
						type: 'Number',
						value: 'NaN',
						location: node.location,
					};
				}
			} else if (ch === OPAREN_CODE) {
				node = this.gobbleGroup() || node;
			}
		}

		return this.gobbleTokenProperty(node);
	}

	/**
	 * Gobble properties of identifiers/strings/arrays/groups.
	 * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
	 * It also gobbles function calls: foo(bar)
	 */
	gobbleTokenProperty(node: AstNode): AstNode {
		this.gobbleSpaces();

		let ch = this.code;
		while (ch === PERIOD_CODE || ch === OBRACK_CODE || ch === OPAREN_CODE) {
			if (!node) {
				// That can be after gobbleGroup, which can return undefined in case `()`
				this.throwError('parse2 :: ' + this.char);
			}

			this.index++;

			if (ch === OBRACK_CODE) {
				const property = this.gobbleExpression();

				this.gobbleSpaces();
				ch = this.code;
				if (ch !== CBRACK_CODE) {
					this.throwError('parse8 :: [');
				}

				if (!property) {
					this.throwError('parse2 :: ' + this.char + '');
				}

				this.index++;

				node = {
					type: 'MemberExpression',
					object: node,
					property,
					location: [node.location[0], this.index],
				};
			} else if (ch === PERIOD_CODE) {
				this.gobbleSpaces();

				const property = this.gobbleIdentifier();
				node = {
					type: 'MemberExpression',
					object: node,
					property: {
						type: 'String',
						value: property.name,
						location: property.location,
					},
					location: [node.location[0], property.location[1]],
				};
			} else if (ch === OPAREN_CODE) {
				if (node.type === 'Identifier') {
					if (!Expression.FUNCTIONS[(node as AstIdentifier).name]) {
						this.throwError('parse14 :: ' + (node as AstIdentifier).name);
					}

					node = {
						type: 'CallExpression',
						arguments: this.gobbleArguments(CPAREN_CODE),
						callee: (node as AstIdentifier).name,
						location: node.location,
					};
				} else {
					if (node.type === 'MemberExpression' && node.property.type === 'String') {
						if (!Expression.FUNCTIONS[node.property.value]) {
							this.throwError('parse14 :: ' + node.property.value);
						}

						node = {
							type: 'CallExpression',
							arguments: [
								node.object,
								...this.gobbleArguments(CPAREN_CODE)
							],
							callee: node.property.value,
							location: node.property.location,
						};
					} else {
						this.throwError('parse13');
					}
				}
			}

			this.gobbleSpaces();
			ch = this.code;
		}

		if (ch === QUESTION_CODE) {
			if (this.expr.charCodeAt(this.index + 1) !== QUESTION_CODE) {
				this.index++;

				node = {
					type: 'UnaryExpression',
					operator: '?',
					argument: node,
					location: [this.index - 1, this.index],
				};
			}
		}

		return node;
	}

	/**
	 * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
	 * keep track of everything in the numeric literal and then calling `parseFloat` on that string
	 */
	gobbleNumericLiteral(): AstNode {
		let number = '';
		const start = this.index;

		while (isDecimalDigit(this.code)) {
			number += this.expr.charAt(this.index++);
		}

		if (this.code === PERIOD_CODE) {
			number += this.expr.charAt(this.index++);

			while (isDecimalDigit(this.code)) {
				number += this.expr.charAt(this.index++);
			}
		}

		let ch = this.char;

		if (ch === 'e' || ch === 'E') { // exponent marker
			number += this.expr.charAt(this.index++);
			ch = this.char;

			if (ch === '+' || ch === '-') { // exponent sign
				number += this.expr.charAt(this.index++);
			}

			while (isDecimalDigit(this.code)) { // exponent itself
				number += this.expr.charAt(this.index++);
			}

			if (!isDecimalDigit(this.expr.charCodeAt(this.index - 1)) ) {
				this.throwError('parse15 :: ' + number + this.char);
			}
		}

		const chCode = this.code;

		// Check to make sure this isn't a variable name that start with a number (123abc)
		if (isIdentifierStart(chCode)) {
			this.throwError('parse6 :: ' + number + this.char);
		} else if (chCode === PERIOD_CODE || (number.length === 1 && number.charCodeAt(0) === PERIOD_CODE)) {
			this.throwError('parse2 :: .');
		}

		const value = parseFloat(number);
		if (value > Number.MAX_VALUE) {
			this.throwError('parse7');
		}

		return {
			type: 'Number',
			value: value,
			location: [start, this.index],
		};
	}

	/**
	 * Parses a string literal, staring with single or double quotes with basic support for escape codes
	 * e.g. `"hello world"`, `'this is\nJSEP'`
	 */
	gobbleStringLiteral(): AstNode {
		let str = '';
		const start = this.index;
		const quote = this.expr.charAt(this.index++);
		let closed = false;

		while (this.index < this.expr.length) {
			let ch = this.expr.charAt(this.index++);

			if (ch === quote) {
				closed = true;
				break;
			} else if (ch === '\\') {
				// Check for all the common escape codes
				ch = this.expr.charAt(this.index++);

				if (quote === '/') {
					str += '\\' + ch;
				} else {
					switch (ch) {
						case 'n': str += '\n'; break;
						case 'r': str += '\r'; break;
						case 't': str += '\t'; break;
						case 'b': str += '\b'; break;
						case 'f': str += '\f'; break;
						case 'v': str += '\x0B'; break;
						default : str += ch;
					}
				}
			} else {
				str += ch;
			}
		}

		if (!closed) {
			this.throwError('parse16 :: ' + str);
		}

		return {
			type: 'String',
			value: str,
			location: [start, this.index],
		};
	}

	/**
	 * Parses a date literal, wrapped by #
	 * e.g. `#2022-07-02T13:38:47.700Z#`, `#2020-01-01 00:00:00#`
	 */
	gobbleDateLiteral(): AstNode {
		const start = this.index;
		const end = this.expr.indexOf('#', this.index + 1) + 1;

		const str = this.expr.substring(start + 1, end - 1);

		let date;
		try {
			date = Convertation.toDate(str);
		} catch (e) {
			this.throwError('parse17');
		}

		this.index = end;

		return {
			type: 'Date',
			value: date.toISOString(),
			location: [start, end],
		};
	}

	/**
	 * Gobbles only identifiers
	 * e.g.: `foo`, `_value`, `$x1`
	 * Also, this function checks if that identifier is a literal:
	 * (e.g. `true`, `false`, `null`) or `this`
	 */
	gobbleIdentifier(): AstIdentifier {
		let ch = this.code;
		const start = this.index;

		if (isIdentifierStart(ch)) {
			this.index++;
		} else {
			this.throwError('parse2 :: ' + this.char);
		}

		while (this.index < this.expr.length) {
			ch = this.code;

			if (isIdentifierPart(ch)) {
				this.index++;
			} else {
				break;
			}
		}

		const name = this.expr.slice(start, this.index);

		if (name[0] === '@') {
			return {
				type: 'Identifier',
				column: true,
				name: name.slice(1),
				location: [start, this.index],
			};
		} else {
			return {
				type: 'Identifier',
				column: false,
				name: name,
				location: [start, this.index],
			};
		}
	}

	/**
	 * Gobbles a list of arguments within the context of a function call
	 * or array literal. This function also assumes that the opening character
	 * `(` or `[` has already been gobbled, and gobbles expressions and commas
	 * until the terminator character `)` or `]` is encountered.
	 * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
	 */
	gobbleArguments(termination: number): AstNode[] {
		const args = [];
		let closed = false;
		let separator_count = 0;

		while (this.index < this.expr.length) {
			this.gobbleSpaces();
			let ch_i = this.code;

			if (ch_i === termination) { // done parsing
				closed = true;
				this.index++;

				if (termination === CPAREN_CODE && separator_count && separator_count >= args.length){
					this.throwError('parse2 :: ' + String.fromCharCode(termination));
				}

				break;
			} else if (ch_i === COMMA_CODE) { // between expressions
				this.index++;
				separator_count++;

				if (separator_count !== args.length) { // missing argument
					this.throwError('parse2 :: ,');
				}
			} else if (args.length !== separator_count) {
				this.throwError('parse5 :: ,');
			} else {
				const node = this.gobbleExpression();

				if (!node) {
					this.throwError('parse5 :: ,');
				}

				args.push(node);
			}
		}

		if (!closed) {
			this.throwError('parse5 :: ' + String.fromCharCode(termination));
		}

		return args;
	}

	/**
	 * Responsible for parsing expression within parentheses `()`
	 * that have no identifier in front (so not a function call)
	 */
	gobbleGroup(): AstNode {
		this.index++;

		const node = this.gobbleExpression();

		if (this.code === CPAREN_CODE) {
			this.index++;
			return node;
		} else {
			this.throwError('parse8 :: (');
		}
	}

	/**
	 * Responsible for parsing Array literals `[1, 2, 3]`
	 * This function assumes that it needs to gobble the opening bracket
	 * and then tries to gobble the expressions as arguments.
	 */
	gobbleArray(): AstNode {
		const start = this.index;

		this.index++;

		const elements = this.gobbleArguments(CBRACK_CODE);

		return {
			type: 'ArrayExpression',
			elements,
			location: [start, this.index],
		};
	}
	/**
	 * Responsible for parsing Object literals `{x: 1, "y": 2}`
	 */
	gobbleObjectExpression(): AstNode {
		const start = this.index;

		this.index++;
		const properties = [];
		let closed = false;

		while (!isNaN(this.code)) {
			this.gobbleSpaces();
			if (this.code === CCURLY_CODE) {
				this.index++;
				closed = true;
				break;
			}

			if (properties.length) {
				if (this.code === COMMA_CODE) {
					this.index++;

					// } after trailing ,
					this.gobbleSpaces();
					// @ts-ignore не видит изменения
					if (this.code === CCURLY_CODE) {
						this.index++;
						closed = true;
						break;
					}
				} else {
					this.throwError('parse9 :: ,');
				}
			}

			const key = this.gobbleExpression();
			if (!key) break;  // missing }

			let keyName, keyLocation = key.location;
			if (key.type === 'Identifier') {
				keyName = key.name;
			} else if (key.type === 'String') {
				keyName = key.value;
			} else if (key.type === 'Null') {
				keyName = 'null';
			} else {
				this.throwError('parse10');
			}

			this.gobbleSpaces();
			if (this.code === COLON_CODE) {
				this.index++;
				const value = this.gobbleExpression();

				if (!value) {
					this.throwError('parse11');
				}

				properties.push({
					key: keyName,
					value: value,
					location: keyLocation,
				});

				this.gobbleSpaces();
			} else {
				this.throwError('parse12');
			}
		}

		if (closed) {
			return this.gobbleTokenProperty({
				type: 'ObjectExpression',
				properties,
				location: [start, this.index],
			});
		} else {
			this.throwError('parse9 :: }');
		}
	}
}

export { Expression };

export function parseExpression(code): ExpressionAst {
	try {
		return {
			version: AST_VERSION,
			code: code,
			source: new Jsep(code).parse(),
			error: null,
		};
	} catch (e) {
		let message = e.message;
		let character = 0;

		const parts = e.message.split(' at character ');
		if (parts.length > 1) {
			message = parts[0];
			character = parts[1] * 1;
		}

		return {
			version: AST_VERSION,
			code: code,
			source: null,
			error: { message, character },
		};
	}
}