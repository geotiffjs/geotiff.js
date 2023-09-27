"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateError = exports.CustomAggregateError = exports.AbortError = exports.zip = exports.wait = exports.parseContentRange = exports.toArrayRecursively = exports.toArray = exports.times = exports.range = exports.invert = exports.forEach = exports.endsWith = exports.chunk = exports.assign = void 0;
function assign(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
}
exports.assign = assign;
function chunk(iterable, length) {
    const results = [];
    const lengthOfIterable = iterable.length;
    for (let i = 0; i < lengthOfIterable; i += length) {
        const chunked = [];
        for (let ci = i; ci < i + length; ci++) {
            chunked.push(iterable[ci]);
        }
        results.push(chunked);
    }
    return results;
}
exports.chunk = chunk;
function endsWith(string, expectedEnding) {
    if (string.length < expectedEnding.length) {
        return false;
    }
    const actualEnding = string.substr(string.length - expectedEnding.length);
    return actualEnding === expectedEnding;
}
exports.endsWith = endsWith;
function forEach(iterable, func) {
    const { length } = iterable;
    for (let i = 0; i < length; i++) {
        func(iterable[i], i);
    }
}
exports.forEach = forEach;
function invert(oldObj) {
    const newObj = {};
    for (const key in oldObj) {
        if (oldObj.hasOwnProperty(key)) {
            const value = oldObj[key];
            newObj[value] = key;
        }
    }
    return newObj;
}
exports.invert = invert;
function range(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
        results.push(i);
    }
    return results;
}
exports.range = range;
function times(numTimes, func) {
    const results = [];
    for (let i = 0; i < numTimes; i++) {
        results.push(func(i));
    }
    return results;
}
exports.times = times;
function toArray(iterable) {
    const results = [];
    const { length } = iterable;
    for (let i = 0; i < length; i++) {
        results.push(iterable[i]);
    }
    return results;
}
exports.toArray = toArray;
function toArrayRecursively(input) {
    if (input.length) {
        return toArray(input).map(toArrayRecursively);
    }
    return input;
}
exports.toArrayRecursively = toArrayRecursively;
// copied from https://github.com/academia-de-codigo/parse-content-range-header/blob/master/index.js
function parseContentRange(headerValue) {
    if (!headerValue) {
        return null;
    }
    if (typeof headerValue !== 'string') {
        throw new Error('invalid argument');
    }
    const parseInt = (number) => Number.parseInt(number, 10);
    // Check for presence of unit
    let matches = headerValue.match(/^(\w*) /);
    const unit = matches && matches[1];
    // check for start-end/size header format
    matches = headerValue.match(/(\d+)-(\d+)\/(\d+|\*)/);
    if (matches) {
        return {
            unit,
            first: parseInt(matches[1]),
            last: parseInt(matches[2]),
            length: matches[3] === '*' ? null : parseInt(matches[3]),
        };
    }
    // check for size header format
    matches = headerValue.match(/(\d+|\*)/);
    if (matches) {
        return {
            unit,
            first: null,
            last: null,
            length: matches[1] === '*' ? null : parseInt(matches[1]),
        };
    }
    return null;
}
exports.parseContentRange = parseContentRange;
/*
 * Promisified wrapper around 'setTimeout' to allow 'await'
 */
async function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
exports.wait = wait;
function zip(a, b) {
    const A = Array.isArray(a) ? a : Array.from(a);
    const B = Array.isArray(b) ? b : Array.from(b);
    return A.map((k, i) => [k, B[i]]);
}
exports.zip = zip;
// Based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
class AbortError extends Error {
    constructor(params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(params);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AbortError);
        }
        this.name = 'AbortError';
    }
}
exports.AbortError = AbortError;
class CustomAggregateError extends Error {
    constructor(errors, message) {
        super(message);
        this.errors = errors;
        this.message = message;
        this.name = 'AggregateError';
    }
}
exports.CustomAggregateError = CustomAggregateError;
exports.AggregateError = CustomAggregateError;
//# sourceMappingURL=utils.js.map