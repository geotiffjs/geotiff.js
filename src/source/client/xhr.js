import { BaseClient, BaseResponse } from './base';


class XHRResponse extends BaseResponse {
  /**
   * BaseResponse facade for XMLHttpRequest
   * @param {XMLHttpRequest} xhr
   * @param {ArrayBuffer} data
   */
  constructor(xhr, data) {
    this.xhr = xhr;
    this.data = data;
  }

  get status() {
    return this.xhr.status;
  }

  getHeader(name) {
    return this.response.headers.getResponseHeader(name);
  }

  async getData() {
    return this.data;
  }
}

export class XHRClient extends BaseClient {
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
      xhr.onabort = () => reject(new Error('Request aborted'));
      xhr.send();

      if (signal) {
        signal.addEventListener('abort', () => xhr.abort());
      }
    });
  }

  async request({ headers, signal } = {}) {
    const response = await this.constructRequest(headers, signal);
    return response;
  }
}
