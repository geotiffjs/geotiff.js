import { Pool as tPool, spawn, Worker, Transfer } from 'threads';

const defaultPoolSize = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : null;

/**
 * @module pool
 */

/**
 * Pool for workers to decode chunks of the images.
 */
class Pool {
  /**
   * @constructor
   * @param {Number} size The size of the pool. Defaults to the number of CPUs
   *                      available. When this parameter is `null` or 0, then the
   *                      decoding will be done in the main thread.
   * @param {Worker} worker The decoder worker, loaded and initialised. Enables
   *                        loading the worker using worker-loader(or others) externally
   *                        when using this library as a webpack dependency.
   */
  constructor(size = defaultPoolSize, worker = new Worker('./decoder.worker.js')) {
    this.pool = tPool(() => spawn(worker), size);
  }

  /**
   * Decode the given block of bytes with the set compression method.
   * @param {ArrayBuffer} buffer the array buffer of bytes to decode.
   * @returns {Promise.<ArrayBuffer>} the decoded result as a `Promise`
   */
  async decode(fileDirectory, buffer) {
    return new Promise((resolve, reject) => {
      this.pool.queue(async (decode) => {
        try {
          const data = await decode(fileDirectory, Transfer(buffer));
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  destroy() {
    this.pool.terminate(true);
  }
}

export default Pool;
