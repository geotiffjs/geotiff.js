export class BaseResponse {
  /**
   * Returns whether the response has an ok'ish status code
   */
  get ok() {
    return this.status >= 200 && this.status <= 299;
  }

  /**
   * Returns the status code of the response
   */
  get status() {
    throw new Error('not implemented');
  }

  /**
   * Returns the value of the specified header
   * @param {string} headerName the header name
   * @returns {string} the header value
   */
  getHeader(headerName) { // eslint-disable-line no-unused-vars
    throw new Error('not implemented');
  }

  /**
   * @returns {ArrayBuffer} the response data of the request
   */
  async getData() {
    throw new Error('not implemented');
  }
}

export class BaseClient {
  constructor(url) {
    this.url = url;
  }

  /**
   * Send a request with the options
   * @param {object} [options]
   */
  async request({ headers, credentials, signal } = {}) { // eslint-disable-line no-unused-vars
    throw new Error('request is not implemented');
  }
}
