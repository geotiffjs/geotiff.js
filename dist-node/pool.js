"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./compression/index.js");
const defaultPoolSize = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 2) : 2;
/**
 * @module pool
 */
/**
 * Pool for workers to decode chunks of the images.
 */
class Pool {
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
    constructor(size = defaultPoolSize, createWorker) {
        this.workers = null;
        this._awaitingDecoder = null;
        this.size = size;
        this.messageId = 0;
        if (size) {
            this._awaitingDecoder = createWorker ? Promise.resolve(createWorker) : new Promise((resolve) => {
                Promise.resolve().then(() => __importStar(require('./worker/decoder.js'))).then((module) => {
                    resolve(module.create);
                });
            });
            this._awaitingDecoder.then((create) => {
                this._awaitingDecoder = null;
                this.workers = [];
                for (let i = 0; i < size; i++) {
                    this.workers.push({ worker: create(), idle: true });
                }
            });
        }
    }
    /**
     * Decode the given block of bytes with the set compression method.
     * @param {ArrayBuffer} buffer the array buffer of bytes to decode.
     * @returns {Promise<ArrayBuffer>} the decoded result as a `Promise`
     */
    async decode(fileDirectory, buffer) {
        if (this._awaitingDecoder) {
            await this._awaitingDecoder;
        }
        return this.size === 0
            ? (0, index_js_1.getDecoder)(fileDirectory).then((decoder) => decoder.decode(fileDirectory, buffer))
            : new Promise((resolve) => {
                const worker = this.workers.find((candidate) => candidate.idle)
                    || this.workers[Math.floor(Math.random() * this.size)];
                worker.idle = false;
                const id = this.messageId++;
                const onMessage = (e) => {
                    if (e.data.id === id) {
                        worker.idle = true;
                        resolve(e.data.decoded);
                        worker.worker.removeEventListener('message', onMessage);
                    }
                };
                worker.worker.addEventListener('message', onMessage);
                worker.worker.postMessage({ fileDirectory, buffer, id }, [buffer]);
            });
    }
    destroy() {
        if (this.workers) {
            this.workers.forEach((worker) => {
                worker.worker.terminate();
            });
            this.workers = null;
        }
    }
}
exports.default = Pool;
//# sourceMappingURL=pool.js.map