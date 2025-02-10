import { Typing } from "./internal.js"

export class Comparison {
    static canCompareTypes(type) {
        if (type === Typing.TYPE_NUMBER) return true;
        if (type === Typing.TYPE_DATE) return true;
        if (type === Typing.TYPE_STRING) return true;
        if (type === Typing.TYPE_BOOLEAN) return true;
        if (type === Typing.TYPE_ARRAY) return true;
        if (type === Typing.TYPE_OBJECT) return true;
        return false;
    }

    static isEqual(left, right)
    {
        if (Typing.isDate(left) && Typing.isDate(right)) {
            // Даты сравниваем по меткам
            return left.getTime() === right.getTime();
        }

        if (Typing.isArray(left) && Typing.isArray(right)) {
            if (left.length !== right.length) return false;

            let index = 0;
            for (const leftItem of left) {
                if (!Comparison.isEqual(leftItem, right[index++])) return false;
            }

            return true;
        }

        if (Typing.isObject(left) && Typing.isObject(right)) {
            const leftKeys = Object.keys(left);
            const rightKeys = Object.keys(right);

            if (leftKeys.length !== rightKeys.length) return false;

            let index = 0;
            for (const leftKey of leftKeys) {
                if (!Comparison.isEqual(leftKey, rightKeys[index])) return false;
                if (!Comparison.isEqual(left[leftKey], right[rightKeys[index]])) return false;
                index++;
            }

            return true;
        }

        if (Typing.isNaN(left) && Typing.isNaN(right)) {
            return true;
        }

        return left === right;
    }

    static isGreater(left: any, right: any) {
        const leftType = Typing.getType(left);
        const rightType = Typing.getType(right);
        const sameType = leftType === rightType;

        if (sameType && this.canCompareTypes(leftType)) {
            if (leftType === Typing.TYPE_ARRAY) {
                let index = 0;
                for (const leftValue of left) {
                    if (right.length < index + 1) return true;

                    if (!this.isEqual(leftValue, right[index])) {
                        return this.isGreater(leftValue, right[index]);
                    }

                    index++;
                }

                return false;
            } else if (leftType === Typing.TYPE_OBJECT) {
                const leftKeys = Object.keys(left);
                const rightKeys = Object.keys(right);

                let index = 0;
                for (const leftKey of leftKeys) {
                    if (rightKeys.length < index + 1) return true;

                    if (!this.isEqual(leftKey, rightKeys[index])) {
                        return this.isGreater(leftKey, rightKeys[index]);
                    }

                    if (!this.isEqual(left[leftKey], right[rightKeys[index]])) {
                        return this.isGreater(left[leftKey], right[rightKeys[index]]);
                    }

                    index++;
                }

                return false;
            } else if (!Typing.isNaN(left) && Typing.isNaN(right)) {
                return true;
            } else {
                return left > right;
            }
        } else {
            const order = [
                Typing.TYPE_NULL,
                Typing.TYPE_NUMBER,
                Typing.TYPE_STRING,
                Typing.TYPE_OBJECT,
                Typing.TYPE_ARRAY,
                Typing.TYPE_BOOLEAN,
                Typing.TYPE_DATE,
            ];

            return order.indexOf(leftType) > order.indexOf(rightType);
        }
    }

    static isLess(left: any, right: any) {
        return !this.isEqual(left, right) && !this.isGreater(left, right);
    }
}