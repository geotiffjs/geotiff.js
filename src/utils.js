/**
 * @param {Record<string, any>} target
 * @param {Record<string, any>} source
 */
export function assign(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}

/**
 * @template T
 * @param {ArrayLike<T>} iterable
 * @param {number} length
 * @returns {Array<Array<T>>}
 */
export function chunk(iterable, length) {
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

/**
 * @param {string} string
 * @param {string} expectedEnding
 * @returns {boolean}
 */
export function endsWith(string, expectedEnding) {
  if (string.length < expectedEnding.length) {
    return false;
  }
  const actualEnding = string.substr(string.length - expectedEnding.length);
  return actualEnding === expectedEnding;
}

/**
 * @param {ArrayLike<any>} iterable
 * @param {(value: any, index: number) => void} func
 */
export function forEach(iterable, func) {
  const { length } = iterable;
  for (let i = 0; i < length; i++) {
    func(iterable[i], i);
  }
}

/**
 * @param {Record<string, string>} oldObj
 * @returns {Record<string, string>}
 */
export function invert(oldObj) {
  /** @type {Record<string, string>} */
  const newObj = {};
  for (const key in oldObj) {
    if (oldObj.hasOwnProperty(key)) {
      const value = oldObj[key];
      newObj[value] = key;
    }
  }
  return newObj;
}

/**
 * @param {number} n
 * @returns {Array<number>}
 */
export function range(n) {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(i);
  }
  return results;
}

/**
 * @param {number} numTimes
 * @param {(index: number) => any} func
 * @returns {Array<any>}
 */
export function times(numTimes, func) {
  const results = [];
  for (let i = 0; i < numTimes; i++) {
    results.push(func(i));
  }
  return results;
}

/**
 * @template T
 * @param {ArrayLike<T>} iterable
 * @returns {Array<T>}
 */
export function toArray(iterable) {
  const results = [];
  const { length } = iterable;
  for (let i = 0; i < length; i++) {
    results.push(iterable[i]);
  }
  return results;
}

/**
 * @param {any} input
 * @returns {any}
 */
export function toArrayRecursively(input) {
  if (input.length) {
    return toArray(input).map(toArrayRecursively);
  }
  return input;
}

/**
 * Copied from https://github.com/academia-de-codigo/parse-content-range-header/blob/master/index.js
 * @param {string} headerValue
 * @returns {{unit: string|null, first: number|null, last: number|null, length: number|null}|null}}
 */
export function parseContentRange(headerValue) {
  if (!headerValue) {
    return null;
  }

  if (typeof headerValue !== 'string') {
    throw new Error('invalid argument');
  }

  /**
   * @param {string} number
   * @returns {number}
   */
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

/**
 * Promisified wrapper around 'setTimeout' to allow 'await'
 * @param {number} [milliseconds]
 * @returns {Promise<void>}
 */
export async function wait(milliseconds = 0) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * @template T,U
 * @param {Iterable<T>} a
 * @param {Iterable<U>} b
 * @returns {Array<[T, U]>}
 */
export function zip(a, b) {
  const A = Array.isArray(a) ? a : Array.from(a);
  const B = Array.isArray(b) ? b : Array.from(b);
  return A.map((k, i) => [k, B[i]]);
}

// Based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
export class AbortError extends Error {
  /**
   * @param  {...any} args
   */
  constructor(...args) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...args);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AbortError);
    }

    this.name = 'AbortError';
  }
}

export class CustomAggregateError extends Error {
  /**
   * @param {Array<Error>} errors
   * @param {string} message
   */
  constructor(errors, message) {
    super(message);
    this.errors = errors;
    this.message = message;
    this.name = 'AggregateError';
  }
}

export const AggregateError = CustomAggregateError;

/**
 * @param {any} input
 * @returns {boolean}
 */
export function isTypedFloatArray(input) {
  if (ArrayBuffer.isView(input)) {
    const ctr = input.constructor;
    if (ctr === Float32Array || ctr === Float64Array) {
      return true;
    }
  }
  return false;
}

/**
 * @param {any} input
 * @returns {boolean}
 */
export function isTypedIntArray(input) {
  if (ArrayBuffer.isView(input)) {
    const ctr = input.constructor;
    if (ctr === Int8Array || ctr === Int16Array || ctr === Int32Array) {
      return true;
    }
  }
  return false;
}

/**
 * @param {any} input
 * @returns {boolean}
 */
export function isTypedUintArray(input) {
  if (ArrayBuffer.isView(input)) {
    const ctr = input.constructor;
    if (ctr === Uint8Array || ctr === Uint16Array || ctr === Uint32Array || ctr === Uint8ClampedArray) {
      return true;
    }
  }
  return false;
}

export const typeMap = {
  Float64Array,
  Float32Array,
  Uint32Array,
  Uint16Array,
  Uint8Array,
};
