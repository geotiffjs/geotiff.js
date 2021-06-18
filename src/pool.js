import Worker from 'web-worker';
import workerURL from "worker-url:./decoder.worker.js";

const defaultPoolSize = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : null;

// Ok to use type == 'module' even thought it's not supported in Firefox.
// There are no import statemetns in the worker.
const defaultWorkerFactory = () => new Worker(workerURL, { type: 'module' });

// based on https://gist.github.com/developit/65a2212731f6b00a8aaa55d70c594f5c
class Pool {
  constructor(size = defaultPoolSize, workerFactory = defaultWorkerFactory) {
    this.workerFactory = workerFactory;
    let worker = workerFactory();
    this.poolSize = size ?? 4;
    this.used = 1;
    this.pool = [worker];
    this.jobs = [];
  }

  decode(fileDirectory, buffer) {
    // queue job
    return new Promise((resolve, reject) => {
      this.jobs.push({ fileDirectory, buffer, resolve, reject });
      this._nextJob();
    });
  }

  _nextJob() {
    let worker = this.pool.pop();
    if (!worker) {
      if (this.used >= this.poolSize) return;
      this.used++;
      worker = this.workerFactory();
    }
    const job = this.jobs.shift();
    if (!job) return;
    worker.onmessage = event => job.resolve(event.data);
    worker.onerror = err => job.reject(err);
    worker.postMessage(['decode', job.fileDirectory, job.buffer], [job.buffer]);
  }
}

export default Pool;
