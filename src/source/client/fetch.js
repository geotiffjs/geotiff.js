import { BaseClient, BaseResponse } from './base.js';

class FetchResponse extends BaseResponse {
  /**
   * BaseResponse facade for fetch API Response
   * @param {Response} response
   */
  constructor(response) {
    super();
    this.response = response;
  }

  get status() {
    return this.response.status;
  }

  getHeader(name) {
    return this.response.headers.get(name);
  }

  async getData() {
    const data = this.response.arrayBuffer
      ? await this.response.arrayBuffer()
      : (await this.response.buffer()).buffer;
    return data;
  }
}

export class FetchClient extends BaseClient {
  constructor(url, credentials) {
    super(url);
    this.credentials = credentials;
  }

  /**
   * @param {{headers: HeadersInit, signal: AbortSignal}} [options={}]
   * @returns {Promise<FetchResponse>}
   */
  async request({ headers, signal } = {}) {
    const response = await fetch(this.url, {
      headers, credentials: this.credentials, signal,
    });
    return new FetchResponse(response);
  }
}
