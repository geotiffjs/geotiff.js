import work from 'webworkify';
import worker from './worker';
import { getDecoder } from './compression';


const defaultPoolSize = navigator.hardwareConcurrency;

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
  constructor(compression, size = defaultPoolSize) {
    this.compression = compression;
    this.workers = [];
    this.decoder = null;

    for (let i = 0; i < size; ++i) {
      const w = work(worker);
      this.workers.push(w);
    }

    if (size === null || size < 1) {
      this.decoder = getDecoder(compression);
    }
  }

  /**
   * Decode the given block of bytes with the set compression method.
   * @param {ArrayBuffer} buffer the array buffer of bytes to decode.
   * @returns {Promise.<ArrayBuffer>} the decoded result as a `Promise`
   */
  decodeBlock(buffer) {
    if (this.decoder) {
      return this.decoder.decodeBlock(buffer);
    }

    return this.waitForWorker()
      .then((currentWorker) => {
        return new Promise((resolve, reject) => {
          currentWorker.onmessage = (event) => {
            this.workers.push(currentWorker);
            resolve(event.data[0]);
          };
          currentWorker.onerror = (error) => {
            this.workers.push(currentWorker);
            reject(error);
          };
          currentWorker.postMessage([
            'decode', this.compression, buffer,
          ], [buffer]);
        });
      });
  }

  waitForWorker() {
    const sleepTime = 10;
    const waiter = (callback) => {
      if (this.workers.length) {
        callback(this.workers.pop());
      } else {
        setTimeout(waiter, sleepTime, callback);
      }
    };

    return new Promise((resolve) => {
      waiter(resolve);
    });
  }

  destroy() {
    for (let i = 0; i < this.workers.length; ++i) {
      this.workers[i].terminate();
    }
  }
}

export default Pool;
