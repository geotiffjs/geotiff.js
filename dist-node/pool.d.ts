export default Pool;
/**
 * @module pool
 */
/**
 * Pool for workers to decode chunks of the images.
 */
declare class Pool {
    /**
     * @constructor
     * @param {Number} [size] The size of the pool. Defaults to the number of CPUs
     *                      available. When this parameter is `null` or 0, then the
     *                      decoding will be done in the main thread.
     * @param {function(): Worker} [createWorker] A function that creates the decoder worker.
     * Defaults to a worker with all decoders that ship with geotiff.js. The `createWorker()`
     * function is expected to return a `Worker` compatible with Web Workers. For code that
     * runs in Node, [web-worker](https://www.npmjs.com/package/web-worker) is a good choice.
     *
     * A worker that uses a custom lzw decoder would look like this `my-custom-worker.js` file:
     * ```js
     * import { addDecoder, getDecoder } from 'geotiff';
     * addDecoder(5, () => import ('./my-custom-lzw').then((m) => m.default));
     * self.addEventListener('message', async (e) => {
     *   const { id, fileDirectory, buffer } = e.data;
     *   const decoder = await getDecoder(fileDirectory);
     *   const decoded = await decoder.decode(fileDirectory, buffer);
     *   self.postMessage({ decoded, id }, [decoded]);
     * });
     * ```
     * The way the above code is built into a worker by the `createWorker()` function
     * depends on the used bundler. For most bundlers, something like this will work:
     * ```js
     * function createWorker() {
     *   return new Worker(new URL('./my-custom-worker.js', import.meta.url));
     * }
     * ```
     */
    constructor(size?: number | undefined, createWorker?: (() => Worker) | undefined);
    workers: any[] | null;
    _awaitingDecoder: Promise<any> | null;
    size: number;
    messageId: number;
    /**
     * Decode the given block of bytes with the set compression method.
     * @param {ArrayBuffer} buffer the array buffer of bytes to decode.
     * @returns {Promise<ArrayBuffer>} the decoded result as a `Promise`
     */
    decode(fileDirectory: any, buffer: ArrayBuffer): Promise<ArrayBuffer>;
    destroy(): void;
}
//# sourceMappingURL=pool.d.ts.map