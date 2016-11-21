'use strict';

import work from 'webworkify';
import worker from './worker.js';
import { getDecoder } from './compression';


const defaultPoolSize = navigator.hardwareConcurrency;

export default class Pool {
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

  decodeBlock(buffer) {
    if (this.decoder) {
      return this.decoder.decodeBlock(buffer);
    }
    return this.waitForWorker()
      .then(currentWorker => {
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
            'decode', this.compression, buffer
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
