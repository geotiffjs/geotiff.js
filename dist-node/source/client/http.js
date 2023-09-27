"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const url_1 = __importDefault(require("url"));
const base_js_1 = require("./base.js");
const utils_js_1 = require("../../utils.js");
class HttpResponse extends base_js_1.BaseResponse {
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
class HttpClient extends base_js_1.BaseClient {
    constructor(url) {
        super(url);
        this.parsedUrl = url_1.default.parse(this.url);
        this.httpApi = (this.parsedUrl.protocol === 'http:' ? http_1.default : https_1.default);
    }
    constructRequest(headers, signal) {
        return new Promise((resolve, reject) => {
            const request = this.httpApi.get({
                ...this.parsedUrl,
                headers,
            }, (response) => {
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
            });
            request.on('error', reject);
            if (signal) {
                if (signal.aborted) {
                    request.destroy(new utils_js_1.AbortError('Request aborted'));
                }
                signal.addEventListener('abort', () => request.destroy(new utils_js_1.AbortError('Request aborted')));
            }
        });
    }
    async request({ headers, signal } = {}) {
        const response = await this.constructRequest(headers, signal);
        return response;
    }
}
exports.HttpClient = HttpClient;
//# sourceMappingURL=http.js.map