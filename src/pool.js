import { getDecoder } from './compression';
import { create as createWorker } from './worker/decoder';

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
   * @param {Number} size The size of the pool. Defaults to the number of CPUs
   *                      available. When this parameter is `null` or 0, then the
   *                      decoding will be done in the main thread.
   */
  constructor(size = defaultPoolSize) {
    this.workers = null;
    this.size = size;
    this.messageId = 0;
    if (size) {
      this.workers = [];
      for (let i = 0; i < size; i++) {
        this.workers.push({ worker: createWorker(), idle: true });
      }
    }
  }

  /**
   * Decode the given block of bytes with the set compression method.
   * @param {ArrayBuffer} buffer the array buffer of bytes to decode.
   * @returns {Promise.<ArrayBuffer>} the decoded result as a `Promise`
   */
  decode(fileDirectory, buffer) {
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
