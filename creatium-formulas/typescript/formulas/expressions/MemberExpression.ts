import { ExpressionNode, Expression, Typing, Identifier, OptimizedNode } from "../internal.js"

import { AstMemberExpression } from "../tsd.js"

export class MemberExpression extends ExpressionNode {
    private object: ExpressionNode;
    private property: ExpressionNode;

    private nullSafe: boolean = true;

    private existsMode: boolean = false;

    constructor(Expr: Expression, node: AstMemberExpression) {
        super(Expr);

        if (!node) {
            throw new Error('Wrong node');
        }

        if (!node.hasOwnProperty('object')) {
            throw new Error('Member expression without object');
        }

        if (!node.hasOwnProperty('property')) {
            throw new Error('Member expression without property');
        }

        this.object = this.Expr.makeNode(node.object);
        this.property = this.Expr.makeNode(node.property);
    }

    disableNullSafety() {
        this.nullSafe = false;

        if (this.object instanceof MemberExpression) {
            this.object.disableNullSafety();
        }
    }

    enableExistsMode() {
        this.existsMode = true;

        if (this.object instanceof MemberExpression || this.object instanceof Identifier) {
            this.object.enableExistsMode();
        }
    }

    optimize(): ExpressionNode {
        this.object = this.object.optimize();
        this.property = this.property.optimize();

        // Странно, но монга не идет дальше этого и не оптимизирует до конца

        return this;
    }

    evaluate(scope: any, existsMode = false) {
        this.Expr.checkEvaluationLimits(this);

        const object = this.object.evaluate(scope);
        let property = this.property.evaluate(scope);

        if (Typing.isNull(object) && this.nullSafe === false) {
            return null;
        } else if (Typing.isArray(object) && Typing.isNumber(property)) {
            if (Typing.is32BitInteger(property)) {
                const propertyFixed = property < 0 ? object.length + property : property;

                if (object.hasOwnProperty(propertyFixed)) {
                    return object[propertyFixed];
                } else {
                    // Все равно обращаемся к несуществующему элементу, чтобы Proxy это могли зафиксировать
                    object[propertyFixed];

                    if (this.nullSafe) {
                        if (this.existsMode) {
                            throw new Error('undefined');
                        } else {
                            throw new Error('member2 :: ' + property);
                        }
                    } else {
                        return null;
                    }
                }
            } else {
                throw new Error('member3');
            }
        } else if (Typing.isObject(object) && Typing.isString(property)) {
            if (object.hasOwnProperty(property)) {
                return object[property];
            } else {
                // Все равно обращаемся к несуществующему элементу, чтобы Proxy это могли зафиксировать
                object[property];

                if (this.nullSafe) {
                    if (this.existsMode) {
                        throw new Error('undefined');
                    } else {
                        throw new Error('member2 :: ' + property);
                    }
                } else {
                    return null;
                }
            }
        } else {
            if (this.existsMode) {
                throw new Error('undefined');
            } else {
                throw new Error('member1 :: ' + Typing.getType(object) + ',' + Typing.getType(property));
            }
        }
    }

    evaluateExists(scope)
    {
        try {
            this.evaluate(scope);
            return true;
        } catch (e) {
            if (e.message === 'undefined') {
                return false;
            }

            throw e;
        }
    }

    gatherExternalIdentifiers() {
        return [
            ...this.object.gatherExternalIdentifiers(),
            ...this.property.gatherExternalIdentifiers()
        ];
    }

    preEvaluate(localVariables: string[], scope: any) {
        this.object = this.object.preEvaluate(localVariables, scope);
        this.property = this.property.preEvaluate(localVariables, scope);

        if (this.object instanceof OptimizedNode) {
            if (this.property instanceof OptimizedNode) {
                return new OptimizedNode(this, scope);
            }
        }

        return this;
    }

    public toCode() {
        return [
            this.object.toCode(),
            '[',
            this.property.toCode(),
            ']',
        ].join('');
    }
}