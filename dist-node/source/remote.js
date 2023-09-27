"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRemoteSource = exports.makeHttpSource = exports.makeXHRSource = exports.makeFetchSource = void 0;
const httputils_js_1 = require("./httputils.js");
const basesource_js_1 = require("./basesource.js");
const blockedsource_js_1 = require("./blockedsource.js");
const fetch_js_1 = require("./client/fetch.js");
const xhr_js_1 = require("./client/xhr.js");
const http_js_1 = require("./client/http.js");
class RemoteSource extends basesource_js_1.BaseSource {
    /**
     *
     * @param {BaseClient} client
     * @param {object} headers
     * @param {numbers} maxRanges
     * @param {boolean} allowFullFile
     */
    constructor(client, headers, maxRanges, allowFullFile) {
        super();
        this.client = client;
        this.headers = headers;
        this.maxRanges = maxRanges;
        this.allowFullFile = allowFullFile;
        this._fileSize = null;
    }
    /**
     *
     * @param {Slice[]} slices
     */
    async fetch(slices, signal) {
        // if we allow multi-ranges, split the incoming request into that many sub-requests
        // and join them afterwards
        if (this.maxRanges >= slices.length) {
            return this.fetchSlices(slices, signal);
        }
        else if (this.maxRanges > 0 && slices.length > 1) {
            // TODO: split into multiple multi-range requests
            // const subSlicesRequests = [];
            // for (let i = 0; i < slices.length; i += this.maxRanges) {
            //   subSlicesRequests.push(
            //     this.fetchSlices(slices.slice(i, i + this.maxRanges), signal),
            //   );
            // }
            // return (await Promise.all(subSlicesRequests)).flat();
        }
        // otherwise make a single request for each slice
        return Promise.all(slices.map((slice) => this.fetchSlice(slice, signal)));
    }
    async fetchSlices(slices, signal) {
        const response = await this.client.request({
            headers: {
                ...this.headers,
                Range: `bytes=${slices
                    .map(({ offset, length }) => `${offset}-${offset + length}`)
                    .join(',')}`,
            },
            signal,
        });
        if (!response.ok) {
            throw new Error('Error fetching data.');
        }
        else if (response.status === 206 || (response.status === 200 && this.client.url.startsWith('file:///'))) {
            const { type, params } = (0, httputils_js_1.parseContentType)(response.getHeader('content-type'));
            if (type === 'multipart/byteranges') {
                const byteRanges = (0, httputils_js_1.parseByteRanges)(await response.getData(), params.boundary);
                this._fileSize = byteRanges[0].fileSize || null;
                return byteRanges;
            }
            const data = await response.getData();
            const { start, end, total } = (0, httputils_js_1.parseContentRange)(response.getHeader('content-range'));
            this._fileSize = total || null;
            const first = [{
                    data,
                    offset: start,
                    length: end - start,
                }];
            if (slices.length > 1) {
                // we requested more than one slice, but got only the first
                // unfortunately, some HTTP Servers don't support multi-ranges
                // and return only the first
                // get the rest of the slices and fetch them iteratively
                const others = await Promise.all(slices.slice(1).map((slice) => this.fetchSlice(slice, signal)));
                return first.concat(others);
            }
            return first;
        }
        else {
            if (!this.allowFullFile) {
                throw new Error('Server responded with full file');
            }
            const data = await response.getData();
            this._fileSize = data.byteLength;
            return [{
                    data,
                    offset: 0,
                    length: data.byteLength,
                }];
        }
    }
    async fetchSlice(slice, signal) {
        const { offset, length } = slice;
        const response = await this.client.request({
            headers: {
                ...this.headers,
                Range: `bytes=${offset}-${offset + length}`,
            },
            signal,
        });
        // check the response was okay and if the server actually understands range requests
        if (!response.ok) {
            throw new Error('Error fetching data.');
        }
        else if (response.status === 206) {
            const data = await response.getData();
            const { total } = (0, httputils_js_1.parseContentRange)(response.getHeader('content-range'));
            this._fileSize = total || null;
            return {
                data,
                offset,
                length,
            };
        }
        else {
            if (!this.allowFullFile) {
                throw new Error('Server responded with full file');
            }
            const data = await response.getData();
            this._fileSize = data.byteLength;
            return {
                data,
                offset: 0,
                length: data.byteLength,
            };
        }
    }
    get fileSize() {
        return this._fileSize;
    }
}
function maybeWrapInBlockedSource(source, { blockSize, cacheSize }) {
    if (blockSize === null) {
        return source;
    }
    return new blockedsource_js_1.BlockedSource(source, { blockSize, cacheSize });
}
function makeFetchSource(url, { headers = {}, credentials, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
    const client = new fetch_js_1.FetchClient(url, credentials);
    const source = new RemoteSource(client, headers, maxRanges, allowFullFile);
    return maybeWrapInBlockedSource(source, blockOptions);
}
exports.makeFetchSource = makeFetchSource;
function makeXHRSource(url, { headers = {}, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
    const client = new xhr_js_1.XHRClient(url);
    const source = new RemoteSource(client, headers, maxRanges, allowFullFile);
    return maybeWrapInBlockedSource(source, blockOptions);
}
exports.makeXHRSource = makeXHRSource;
function makeHttpSource(url, { headers = {}, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
    const client = new http_js_1.HttpClient(url);
    const source = new RemoteSource(client, headers, maxRanges, allowFullFile);
    return maybeWrapInBlockedSource(source, blockOptions);
}
exports.makeHttpSource = makeHttpSource;
/**
 *
 * @param {string} url
 * @param {object} options
 */
function makeRemoteSource(url, { forceXHR = false, ...clientOptions } = {}) {
    if (typeof fetch === 'function' && !forceXHR) {
        return makeFetchSource(url, clientOptions);
    }
    if (typeof XMLHttpRequest !== 'undefined') {
        return makeXHRSource(url, clientOptions);
    }
    return makeHttpSource(url, clientOptions);
}
exports.makeRemoteSource = makeRemoteSource;
//# sourceMappingURL=remote.js.map