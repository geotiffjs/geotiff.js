import http from 'http';
import https from 'https';
import urlMod from 'url';

import { BaseClient, BaseResponse } from './base.js';
import { AbortError } from '../../utils.js';

class HttpResponse extends BaseResponse {
  /**
   * BaseResponse facade for node HTTP/HTTPS API Response
   * @param {import('http').IncomingMessage} response
   * @param {Promise<ArrayBuffer>} dataPromise
   */
  constructor(response, dataPromise) {
    super();
    this.response = response;
    this.dataPromise = dataPromise;
  }

  get status() {
    return /** @type {number} */ (this.response.statusCode);
  }

  /**
   * @param {string} name
   * @returns {string|undefined}
   */
  getHeader(name) {
    const value = this.response.headers[name];
    return Array.isArray(value) ? value.join(', ') : value;
  }

  async getData() {
    const data = await this.dataPromise;
    return data;
  }
}

export class HttpClient extends BaseClient {
  /** @param {string} url */
  constructor(url) {
    super(url);
    this.parsedUrl = urlMod.parse(this.url);
    this.httpApi = (this.parsedUrl.protocol === 'http:' ? http : https);
  }

  /**
   * @param {Object<string, string>} headers
   * @param {AbortSignal} [signal]
   * @returns {Promise<HttpResponse>}
   */
  constructRequest(headers, signal) {
    return new Promise((resolve, reject) => {
      const request = this.httpApi.get(
        {
          ...this.parsedUrl,
          headers,
        },
        (response) => {
          const dataPromise = new Promise((resolveData) => {
            /** @type {Uint8Array[]} */
            const chunks = [];

            // collect chunks
            response.on('data', (chunk) => {
              chunks.push(chunk);
            });

            // concatenate all chunks and resolve the promise with the resulting buffer
            response.on('end', () => {
              const data = Buffer.concat(chunks).buffer;
              resolveData(data);
            });
            response.on('error', reject);
          });
          resolve(new HttpResponse(response, dataPromise));
        },
      );
      request.on('error', reject);

      if (signal) {
        if (signal.aborted) {
          request.destroy(new AbortError('Request aborted'));
        }
        signal.addEventListener('abort', () => request.destroy(new AbortError('Request aborted')));
      }
    });
  }

  async request({ headers = {}, signal = undefined } = {}) {
    const response = await this.constructRequest(headers, signal);
    return response;
  }
}
