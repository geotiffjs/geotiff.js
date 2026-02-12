export class BaseResponse {
  /**
   * Returns whether the response has an ok'ish status code
   */
  get ok() {
    return this.status >= 200 && this.status <= 299;
  }

  /**
   * Returns the status code of the response
   * @returns {number} the status code
   */
  get status() {
    throw new Error('not implemented');
  }

  /**
   * Returns the value of the specified header
   * @param {string} _headerName the header name
   * @returns {string|undefined} the header value
   */
  getHeader(_headerName) { // eslint-disable-line no-unused-vars
    throw new Error('not implemented');
  }

  /**
   * @returns {Promise<ArrayBuffer>} the response data of the request
   */
  async getData() {
    throw new Error('not implemented');
  }
}

export class BaseClient {
  /** @param {string} url */
  constructor(url) {
    this.url = url;
  }

  /**
   * Send a request with the options
   * @param {RequestInit} [_options={}]
   * @returns {Promise<BaseResponse>}
   */
  async request(_options) { // eslint-disable-line no-unused-vars
    throw new Error('request is not implemented');
  }
}
