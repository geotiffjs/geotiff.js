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

  /**
   * @param {string} name
   * @returns {string|null}
   */
  getHeader(name) {
    return this.response.headers.get(name);
  }

  async getData() {
    const data = this.response.arrayBuffer
      ? await this.response.arrayBuffer()
      // FIXME Can this really have a buffer property?
      : (await /** @type {*} */ (this.response).buffer()).buffer;
    return data;
  }
}

export class FetchClient extends BaseClient {
  constructor(url, credentials) {
    super(url);
    this.credentials = credentials;
  }

  /**
   * @param {RequestInit} [options={}]
   * @returns {Promise<FetchResponse>}
   */
  async request({ headers, signal } = {}) {
    const response = await fetch(this.url, {
      headers, credentials: this.credentials, signal,
    });
    return new FetchResponse(response);
  }
}
