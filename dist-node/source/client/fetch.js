"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchClient = void 0;
const base_js_1 = require("./base.js");
class FetchResponse extends base_js_1.BaseResponse {
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
class FetchClient extends base_js_1.BaseClient {
    constructor(url, credentials) {
        super(url);
        this.credentials = credentials;
    }
    async request({ headers, credentials, signal } = {}) {
        const response = await fetch(this.url, {
            headers, credentials, signal,
        });
        return new FetchResponse(response);
    }
}
exports.FetchClient = FetchClient;
//# sourceMappingURL=fetch.js.map