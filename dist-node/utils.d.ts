export function assign(target: any, source: any): void;
export function chunk(iterable: any, length: any): any[][];
export function endsWith(string: any, expectedEnding: any): boolean;
export function forEach(iterable: any, func: any): void;
export function invert(oldObj: any): {};
export function range(n: any): number[];
export function times(numTimes: any, func: any): any[];
export function toArray(iterable: any): any[];
export function toArrayRecursively(input: any): any;
export function parseContentRange(headerValue: any): {
    unit: string | null;
    first: number;
    last: number;
    length: number | null;
} | {
    unit: string | null;
    first: null;
    last: null;
    length: number | null;
} | null;
export function wait(milliseconds: any): Promise<any>;
export function zip(a: any, b: any): any[][];
export class AbortError extends Error {
    constructor(params: any);
}
export class CustomAggregateError extends Error {
    constructor(errors: any, message: any);
    errors: any;
}
export const AggregateError: typeof CustomAggregateError;
//# sourceMappingURL=utils.d.ts.map