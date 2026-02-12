export function assign<T extends Record<string, unknown>, S extends Record<string, unknown>>(
  target: T,
  source: S
): T & S {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      (target as Record<string, unknown>)[key] = source[key];
    }
  }
  return target as T & S;
}

export function chunk<T>(iterable: { length: number; [index: number]: T }, length: number): T[][] {
  const results: T[][] = [];
  const lengthOfIterable = iterable.length;
  for (let i = 0; i < lengthOfIterable; i += length) {
    const chunked: T[] = [];
    for (let ci = i; ci < i + length; ci++) {
      chunked.push(iterable[ci]);
    }
    results.push(chunked);
  }
  return results;
}

export function endsWith(string: string, expectedEnding: string): boolean {
  if (string.length < expectedEnding.length) {
    return false;
  }
  const actualEnding = string.substr(string.length - expectedEnding.length);
  return actualEnding === expectedEnding;
}

export function forEach<T>(iterable: { length: number; [index: number]: T }, func: (item: T, index: number) => void): void {
  const { length } = iterable;
  for (let i = 0; i < length; i++) {
    func(iterable[i], i);
  }
}

export function invert<K extends string | number, V extends string | number>(
  oldObj: Record<K, V>
): Record<V, K> {
  const newObj = {} as Record<V, K>;
  for (const key in oldObj) {
    if (oldObj.hasOwnProperty(key)) {
      const value = oldObj[key];
      newObj[value] = key;
    }
  }
  return newObj;
}

export function range(n: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < n; i++) {
    results.push(i);
  }
  return results;
}

export function times<T>(numTimes: number, func: (index: number) => T): T[] {
  const results: T[] = [];
  for (let i = 0; i < numTimes; i++) {
    results.push(func(i));
  }
  return results;
}

export function toArray<T>(iterable: { length: number; [index: number]: T }): T[] {
  const results: T[] = [];
  const { length } = iterable;
  for (let i = 0; i < length; i++) {
    results.push(iterable[i]);
  }
  return results;
}

export function toArrayRecursively(input: unknown): unknown {
  if (isArrayLike(input)) {
    return toArray(input).map(toArrayRecursively);
  }
  return input;
}


function isArrayLike(v: unknown): v is ArrayLike<unknown> {
  return Boolean(
    v && typeof v === 'object' && 'length' in v && typeof (v as { length: unknown }).length === 'number',
  )
}

// copied from https://github.com/academia-de-codigo/parse-content-range-header/blob/master/index.js
export function parseContentRange(headerValue: string): null | {
  unit: string | null;
  first: number | null;
  last: number | null;
  length: number | null;
} {
  if (!headerValue) {
    return null;
  }

  if (typeof headerValue !== 'string') {
    throw new Error('invalid argument');
  }

  const parseInt: (number: string) => number = (number) => Number.parseInt(number, 10);

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

/*
 * Promisified wrapper around 'setTimeout' to allow 'await'
 */
export async function wait(milliseconds?: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function zip<T, U>(a: Iterable<T>, b: Iterable<U>): [T, U][] {
  const A = Array.isArray(a) ? a : Array.from(a);
  const B = Array.isArray(b) ? b : Array.from(b);
  return A.map((k, i) => [k, B[i]]);
}

// Based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
export class AbortError extends Error {
  constructor(params?: string) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AbortError);
    }

    this.name = 'AbortError';
  }
}

export class CustomAggregateError extends Error {
  errors: Error[];

  constructor(errors: Error[], message: string) {
    super(message);
    this.errors = errors;
    this.message = message;
    this.name = 'AggregateError';
  }
}

export const AggregateError = CustomAggregateError;

export function isTypedFloatArray(input: unknown): input is Float32Array | Float64Array {
  if (ArrayBuffer.isView(input)) {
    const ctr = input.constructor;
    if (ctr === Float32Array || ctr === Float64Array) {
      return true;
    }
  }
  return false;
}

export function isTypedIntArray(input: unknown): input is Int8Array | Int16Array | Int32Array {
  if (ArrayBuffer.isView(input)) {
    const ctr = input.constructor;
    if (ctr === Int8Array || ctr === Int16Array || ctr === Int32Array) {
      return true;
    }
  }
  return false;
}

export function isTypedUintArray(input: unknown): input is Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray {
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
