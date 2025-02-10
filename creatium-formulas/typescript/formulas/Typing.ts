export class Typing {
    static TYPE_DATE = 'date';
    static TYPE_ARRAY = 'array';
    static TYPE_OBJECT = 'object';
    static TYPE_NUMBER = 'number';
    static TYPE_STRING = 'string';
    static TYPE_BOOLEAN = 'boolean';
    static TYPE_NULL = 'null';

    static ISO8601_PATTERN = new RegExp([
        '^',
        '\\d\\d\\d\\d', // year
        '-(0\\d|1[0-2])', // month
        '(',
            '-([0-2]\\d|3[01])', // day
        ')?',
        '(',
            '[Tt ]', // separator
            '([01][0-9]|2[0-3])', // hours
            ':[0-5]\\d', // minutes
            '(',
                ':[0-5]\\d', // seconds
                '(',
                    '\\.\\d+', // milliseconds
                ')?',
            ')?',
        ')?',
        '(',
            '[Zz]', // Zulu time
            '|', // or
            ' ?',
            '[+-]', // timezone
            '([01][0-9]|2[0-3])',
            '(',
                ':?[0-5]\\d',
            ')?',
        ')?',
        '$',
    ].join(''));

    // Диапазон времени, в котором безопасно работать:
    // https://262.ecma-international.org/5.1/#sec-15.9.1.1
    static TIMESTAMP_RANGE = 8_640_000_000_000_000;

    // Допустимый диапазон 32 int
    static INT32_RANGE = 2_147_483_647;

    // Допустимый диапазон double
    static DOUBLE_RANGE = 1.7976931348623157e+308;

    // Почему-то эти ограничения всплывают во многих местах в монге
    static MONGO_LONG_MIN = -9223372036854776832;
    static MONGO_LONG_MAX = 9223372036854775295;

    static isNull(value: any) {
        return value === null;
    }

    static isNumber(value: any) {
        return typeof value === 'number';
    }

    static isFinite(value: any) {
        return Number.isFinite(value);
    }

    static hasFractionalPart(value: any) {
        return Math.trunc(value) !== value;
    }

    static isInfinite(value: any) {
        return !Number.isFinite(value) && !Number.isNaN(value);
    }

    static isNaN(value: any) {
        return Number.isNaN(value);
    }

    static isDate(value: any) {
        return value instanceof Date;
    }

    static is32BitInteger(value: any) {
        if (!this.isNumber(value)) return false;

        // Проверка на целое число
        if (Math.round(value) !== value) return false;

        if (value < -this.INT32_RANGE || value > this.INT32_RANGE) return false;

        return true;
    }

    static isBoolean(value: any) {
        return value === true || value === false;
    }

    static isString(value: any) {
        return typeof value === 'string';
    }

    static isArray(value: any) {
        return value instanceof Array;
    }

    static isObject(value: any) {
        if (this.isArray(value)) return false;
        if (this.isDate(value)) return false;
        return typeof value === 'object' && value !== null;
    }

    static isZero(value: any) {
        return value === 0;
    }

    static getType(value: any) {
        if (this.isNumber(value)) return this.TYPE_NUMBER;
        if (this.isBoolean(value)) return this.TYPE_BOOLEAN;
        if (this.isString(value)) return this.TYPE_STRING;
        if (this.isNull(value)) return this.TYPE_NULL;
        if (this.isArray(value)) return this.TYPE_ARRAY;
        if (this.isDate(value)) return this.TYPE_DATE;
        if (this.isObject(value)) return this.TYPE_OBJECT;
    }

    static fixNegativeZero(value: number) {
        return value + 0;
    }
}