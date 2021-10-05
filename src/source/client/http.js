import http from 'http';
import https from 'https';
import urlMod from 'url';

import { BaseClient, BaseResponse } from './base';
import { AbortError } from '../../utils';

class HttpResponse extends BaseResponse {
  /**
   * BaseResponse facade for node HTTP/HTTPS API Response
   * @param {http.ServerResponse} response
   */
  constructor(response, dataPromise) {
    super();
    this.response = response;
    this.dataPromise = dataPromise;
  }

  get status() {
    return this.response.statusCode;
  }

  getHeader(name) {
    return this.response.headers[name];
  }

  async getData() {
    const data = await this.dataPromise;
    return data;
  }
}

export class HttpClient extends BaseClient {
  constructor(url) {
    super(url);
    this.parsedUrl = urlMod.parse(this.url);
    this.httpApi = (this.parsedUrl.protocol === 'http:' ? http : https);
  }

  constructRequest(headers, signal) {
    return new Promise((resolve, reject) => {
      const request = this.httpApi.get(
        {
          ...this.parsedUrl,
          headers,
        },
        (response) => {
          const dataPromise = new Promise((resolveData) => {
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

  async request({ headers, signal } = {}) {
    const response = await this.constructRequest(headers, signal);
    return response;
  }
}
