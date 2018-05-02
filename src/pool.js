import Worker from './decoder.worker';
import { getDecoder } from './compression';

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
   * @param {Number} compression The TIFF compression identifier.
   * @param {Number} size The size of the pool. Defaults to the number of CPUs
   *                      available. When this parameter is `null` or 0, then the
   *                      decoding will be done in the main thread.
   */
  constructor(compression, fileDirectory, size = defaultPoolSize) {
    this.compression = compression;
    this.workers = [];
    this.idleWorkers = [];
    this.waitQueue = [];
    this.decoder = null;

    for (let i = 0; i < size; ++i) {
      const w = new Worker();
      w.postMessage(['init', fileDirectory]);
      this.workers.push(w);
      this.idleWorkers.push(w);
    }

    if (size === null || size < 1) {
      this.decoder = getDecoder(compression, fileDirectory);
    }
  }

  /**
   * Decode the given block of bytes with the set compression method.
   * @param {ArrayBuffer} buffer the array buffer of bytes to decode.
   * @returns {Promise.<ArrayBuffer>} the decoded result as a `Promise`
   */
  async decodeBlock(buffer) {
    if (this.decoder) {
      return Promise.resolve(this.decoder.decodeBlock(buffer));
    }

    const currentWorker = await this.waitForWorker();
    return new Promise((resolve, reject) => {
      currentWorker.onmessage = (event) => {
        // this.workers.push(currentWorker);
        this.finishTask(currentWorker);
        resolve(event.data[0]);
      };
      currentWorker.onerror = (error) => {
        // this.workers.push(currentWorker);
        this.finishTask(currentWorker);
        reject(error);
      };
      currentWorker.postMessage([
        'decode', this.compression, buffer,
      ], [buffer]);
    });
  }

  async waitForWorker() {
    const idleWorker = this.idleWorkers.pop();
    if (idleWorker) {
      return idleWorker;
    }
    const waiter = {};
    const promise = new Promise((resolve) => {
      waiter.resolve = resolve;
    });

    this.waitQueue.push(waiter);
    return promise;
  }

  async finishTask(currentWorker) {
    const waiter = this.waitQueue.pop();
    if (waiter) {
      waiter.resolve(currentWorker);
    } else {
      this.idleWorkers.push(currentWorker);
    }
  }

  destroy() {
    for (let i = 0; i < this.workers.length; ++i) {
      this.workers[i].terminate();
    }
  }
}

export default Pool;
