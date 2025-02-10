const should_equal = require('should-equal');

const utils = {};

utils.sample = function (array) {
    return array[Math.floor(Math.random() * array.length)];
};

utils.random_array = function (min, max) {
    max++;
    const array = [], length = Math.floor(Math.random() * (max - min)) + min;
    for (let i = 0; i <= length; i++) array.push(i);
    return array;
};

utils.equal = (a, b) => should_equal(a, b).length === 0;

utils.scope = {
    $test1: 1,
    "$te.st2": 1,
    "$0": 2,
    number0: 0,
    number1: 1,
    number2: 2,
    number3: 3,
    number4: 4,
    number_1e_40: 10000000000000000000000000000000000000000,
    minus2: -2,
    string0: '',
    string1: 'abc',
    string2: 'def',
    object0: {},
    object1: {
        a: 1
    },
    object2: {
        a: 1,
        b: 2,
        c: 3,
        d: 4
    },
    array0: [],
    array1: [
        1, 2, 3
    ],
    null1: null,
    true1: true,
    false1: false,
    date0: new Date(0),
};

utils.value2ast = function (value) {
    if (typeof value === 'number') {
        return { type: 'Number', value: value };
    } else if (typeof value === 'string') {
        return { type: 'String', value: value };
    } else if (typeof value === 'boolean') {
        return { type: 'Boolean', value: value };
    } else if (value === null) {
        return { type: 'Null' };
    } else if (value instanceof Array) {
        return {
            type: 'ArrayExpression',
            elements: value.map(item => utils.value2ast(item)),
        };
    } else if (typeof value === 'object') {
        return {
            type: 'ArrayExpression',
            elements: Object.keys(value).map(key => {
                return {
                    key,
                    value: utils.value2ast(value[key]),
                };
            }),
        };
    } else {
        throw new Error('unknown type');
    }
}

module.exports = utils;
