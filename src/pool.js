import { getDecoder, preferWorker } from './compression/index.js';
import create from './worker/create.js';

const defaultPoolSize = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 2) : 2;

/**
 * @module pool
 */

/**
 * Wrapper for a worker that can submit jobs to the worker and receive responses.
 */
class WorkerWrapper {
  /**
   * @param {Worker} worker the worker to wrap
   */
  constructor(worker) {
    this.worker = worker;
    this.worker.addEventListener('message', (e) => this._onWorkerMessage(e));
    this.jobIdCounter = 0;
    this.jobs = new Map();
  }

  /**
   * Get a new job id
   * @returns {Number} the new job id
   */
  newJobId() {
    return this.jobIdCounter++;
  }

  /**
   * Get the number of jobs currently running
   * @returns {Number} the number of jobs currently running
   */
  getJobCount() {
    return this.jobs.size;
  }

  _onWorkerMessage(e) {
    const { jobId, error, ...result } = e.data;
    const job = this.jobs.get(jobId);
    this.jobs.delete(jobId);

    if (error) {
      job.reject(new Error(error));
    } else {
      job.resolve(result);
    }
  }

  /**
   * Submit a job to the worker
   * @param {Object} message the message to send to the worker. A "jobId" property will be added to this object.
   * @param {Object[]} [transferables] an optional array of transferable objects to transfer to the worker.
   * @returns {Promise} a promise that gets resolved/rejected when a message with the same jobId is received from the worker.
   */
  submitJob(message, transferables = undefined) {
    const jobId = this.newJobId();
    let resolve;
    let reject;

    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    this.jobs.set(jobId, { resolve, reject });
    this.worker.postMessage({ ...message, jobId }, transferables);
    return promise;
  }

  terminate() {
    this.worker.terminate();
  }
}

const finalizationRegistry = new FinalizationRegistry((worker) => {
  worker.terminate();
});

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
  constructor(size = defaultPoolSize, createWorker = create) {
    this.workerWrappers = null;
    if (size) {
      this.workerWrappers = (async () => {
        const workerWrappers = [];
        for (let i = 0; i < size; i++) {
          const worker = createWorker();
          const wrapper = new WorkerWrapper(worker);
          workerWrappers.push(wrapper);
          finalizationRegistry.register(wrapper, worker, wrapper);
        }
        return workerWrappers;
      })();
    }
  }

  /**
   * Decode the given block of bytes with the set compression method.
   * @param {ArrayBuffer} buffer the array buffer of bytes to decode.
   * @returns {Promise<ArrayBuffer>} the decoded result as a `Promise`
   */
  async decode(fileDirectory, buffer) {
    if (preferWorker(fileDirectory) && this.workerWrappers) {
      // select the worker with the lowest jobCount
      const workerWrapper = (await this.workerWrappers).reduce((a, b) => {
        return a.getJobCount() < b.getJobCount() ? a : b;
      });
      const { decoded } = await workerWrapper.submitJob({ fileDirectory, buffer }, [buffer]);
      return decoded;
    } else {
      return getDecoder(fileDirectory).then((decoder) => decoder.decode(fileDirectory, buffer));
    }
  }

  async destroy() {
    if (this.workerWrappers) {
      (await this.workerWrappers).forEach((worker) => {
        worker.terminate();
      });
      this.workerWrappers = null;
    }
  }
}

export default Pool;
