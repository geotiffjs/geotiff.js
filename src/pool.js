import { getDecoder } from './compression/index.js';

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
        import('./worker/decoder.js').then((module) => {
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
      ? getDecoder(fileDirectory).then((decoder) => decoder.decode(fileDirectory, buffer))
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

export default Pool;
