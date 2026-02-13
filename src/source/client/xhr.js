import { BaseClient, BaseResponse } from './base.js';
import { AbortError } from '../../utils.js';

class XHRResponse extends BaseResponse {
  /**
   * BaseResponse facade for XMLHttpRequest
   * @param {XMLHttpRequest} xhr
   * @param {ArrayBuffer} data
   */
  constructor(xhr, data) {
    super();
    this.xhr = xhr;
    this.data = data;
  }

  get status() {
    return this.xhr.status;
  }

  /**
   * @param {string} name
   * @returns {string|undefined}
   */
  getHeader(name) {
    return this.xhr.getResponseHeader(name) || undefined;
  }

  async getData() {
    return this.data;
  }
}

export class XHRClient extends BaseClient {
  /**
   * @param {Object<string, string>} headers
   * @param {AbortSignal} [signal]
   * @returns {Promise<XHRResponse>}
   */
  constructRequest(headers, signal) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', this.url);
      xhr.responseType = 'arraybuffer';
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }

      // hook signals
      xhr.onload = () => {
        const data = xhr.response;
        resolve(new XHRResponse(xhr, data));
      };
      xhr.onerror = reject;
      xhr.onabort = () => reject(new AbortError('Request aborted'));
      xhr.send();

      if (signal) {
        if (signal.aborted) {
          xhr.abort();
        }
        signal.addEventListener('abort', () => xhr.abort());
      }
    });
  }

  async request({ headers = {}, signal = undefined } = {}) {
    const response = await this.constructRequest(headers, signal);
    return response;
  }
}
