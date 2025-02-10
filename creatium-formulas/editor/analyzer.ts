import type  * as CodeMirror from "codemirror"

import { Expression } from "../typescript/formulas/Expression"
import { LetFunction } from "../typescript/formulas/functions/logic/LetFunction"
import { ExpressionAst } from "../typescript/formulas/tsd"

function indexToPosition(code: string, index: number) {
    let line = 0;
    let ch = index;

    for (let i = 0; i < index; i++) {
        if (code[i] === '\n') {
            line++;
            ch = index - i - 1;
        }
    }

    return {
        ch: ch,
        line: line
    };
}

export class ExpressionAnalyzer {
    static evaluate(ast: ExpressionAst, scope: any) {
        const results = [];
        ExpressionAnalyzer.patchExpression(results);
        new Expression(ast, Expression.LIMIT_MODE_1M).evaluate(scope);
        ExpressionAnalyzer.restoreExpression();

        const sorted1 = [];
        for (const item of results) {
            sorted1[item.location[0]] = sorted1[item.location[0]] || [];
            sorted1[item.location[0]].push(item);
        }

        const sorted2 = [];
        for (const list of sorted1) {
            if (list) sorted2.push(...list);
        }

        const final = {};
        for (const item of sorted2) {
            const location = `${item.location[0]}-${item.location[1]}`;
            final[location] = final[location] || [];
            final[location].push(item.result);
        }

        return final;
    }

    static patchExpression(results: any[]) {
        Expression.prototype.__makeNode = Expression.prototype.makeNode;
        Expression.prototype.makeNode = (...args) => {
            const node = Expression.prototype.__makeNode(...args);
            node.__source = args[0];
            return node;
        }

        for (const nodeClass of [
            ...Object.values(Expression.BINARY_OPERATORS),
            ...Object.values(Expression.UNARY_OPERATORS),
            ...Object.values(Expression.FUNCTIONS),
            Expression.NODES.Identifier,
        ]) {
            ExpressionAnalyzer.patchNode(nodeClass, results);
        }

        Expression.NODES.ObjectExpression.prototype.__evaluate = Expression.NODES.ObjectExpression.prototype.evaluate;
        Expression.NODES.ObjectExpression.prototype.evaluate = function (...args) {
            const __source = this.__source;

            for (const key in this.object) {
                if (!this.object[key].hasOwnProperty('evaluate')) {
                    const __evaluate = this.object[key].evaluate;
                    this.object[key].evaluate = function (...args) {
                        const result = __evaluate.call(this, ...args);
                        results.push({
                            location: __source.properties.find(prop => prop.key === key).location,
                            result: JSON.parse(JSON.stringify(result)),
                        });
                        return result;
                    }
                }
            }

            return Expression.NODES.ObjectExpression.prototype.__evaluate.call(this, ...args);
        }

        Expression.NODES.MemberExpression.prototype.__evaluate = Expression.NODES.MemberExpression.prototype.evaluate;
        Expression.NODES.MemberExpression.prototype.evaluate = function (...args) {
            const result = Expression.NODES.MemberExpression.prototype.__evaluate.call(this, ...args);

            if (this.__source.property.type === 'Number' || this.__source.property.type === 'String') {
                results.push({
                    location: [
                        this.__source.property.location[0],
                        this.__source.property.location[1]
                    ],
                    result: JSON.parse(JSON.stringify(result)),
                });
            }

            return result;
        }
    }

    static patchNode(nodeClass: any, results: any[]) {
        if (nodeClass.prototype.__evaluate) return;

        nodeClass.prototype.__evaluate = nodeClass.prototype.evaluate;
        nodeClass.prototype.evaluate = function (...args) {
            if (nodeClass === LetFunction) {
                const __source = this.__source;

                for (const key in this.arguments[0].object) {
                    if (!this.arguments[0].object[key].hasOwnProperty('evaluate')) {
                        const __evaluate = this.arguments[0].object[key].evaluate;
                        this.arguments[0].object[key].evaluate = function (...args) {
                            const result = __evaluate.call(this, ...args);
                            results.push({
                                location: __source.arguments[0].properties.find(prop => prop.key === key).location,
                                result: JSON.parse(JSON.stringify(result)),
                            });
                            return result;
                        }
                    }
                }

                return nodeClass.prototype.__evaluate.call(this, ...args);
            } else {
                const result = nodeClass.prototype.__evaluate.call(this, ...args);
                results.push({
                    location: this.__source.location,
                    result: JSON.parse(JSON.stringify(result)),
                });
                return result;
            }
        }
    }

    static restoreExpression() {
        Expression.prototype.makeNode = Expression.prototype.__makeNode;
        delete Expression.prototype.__makeNode;

        for (const nodeClass of [
            ...Object.values(Expression.BINARY_OPERATORS),
            ...Object.values(Expression.UNARY_OPERATORS),
            ...Object.values(Expression.FUNCTIONS),
            Expression.NODES.Identifier,
        ]) {
            ExpressionAnalyzer.restoreNode(nodeClass);
        }

        Expression.NODES.ObjectExpression.prototype.evaluate = Expression.NODES.ObjectExpression.prototype.__evaluate;
        delete Expression.NODES.ObjectExpression.prototype.__evaluate;

        Expression.NODES.MemberExpression.prototype.evaluate = Expression.NODES.MemberExpression.prototype.__evaluate;
        delete Expression.NODES.MemberExpression.prototype.__evaluate;
    }

    static restoreNode(nodeClass: any) {
        if (!nodeClass.prototype.__evaluate) return;

        nodeClass.prototype.evaluate = nodeClass.prototype.__evaluate;
        delete nodeClass.prototype.__evaluate;
    }

    static enableAnalyzer(instance: CodeMirror.EditorFromTextArea, result, callback) {
        instance.setOption('readOnly', 'nocursor');

        const doc = instance.getDoc();
        const code = instance.getDoc().getValue();

        const markers = [];
        for (const key in result) {
            const location = key.split('-').map(item => parseInt(item));
            markers.push(doc.markText(indexToPosition(code, location[0]), indexToPosition(code, location[1]), {
                className: 'analyzer',
                attributes: {
                    'data-location': key,
                },
                startStyle: 'analyzer-start',
                endStyle: 'analyzer-end',
            }));
        }

        instance.on('mousedown', (cm, event) => {
            const pos = cm.coordsChar({ left: event.clientX, top: event.clientY });

            for (const mark of doc.getAllMarks()) {
                if (mark.className.indexOf('analyzer-active') === 0) {
                    mark.clear();
                }
            }

            for (let marker of markers) {
                const range = marker.find();
                if (range && pos.line >= range.from.line && pos.line <= range.to.line &&
                    ((pos.line !== range.from.line && pos.line !== range.to.line) ||
                        (pos.ch >= range.from.ch && pos.ch <= range.to.ch))) {
                    doc.markText(range.from, range.to, {
                        className: 'analyzer-active',
                    });

                    callback(result[marker.attributes['data-location']]);

                    return;
                }
            }

            callback(null);
        });
    }

    static disableAnalyzer(instance: CodeMirror.EditorFromTextArea) {
        instance.setOption('readOnly', false);

        const doc = instance.getDoc();

        for (const mark of doc.getAllMarks()) {
            if (mark.className.indexOf('analyzer') === 0) {
                mark.clear();
            }
        }
    }
}