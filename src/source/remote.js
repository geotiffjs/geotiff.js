import { parseByteRanges, parseContentRange, parseContentType } from './httputils.js';
import { BaseSource } from './basesource.js';
import { BlockedSource } from './blockedsource.js';

import { FetchClient } from './client/fetch.js';
import { XHRClient } from './client/xhr.js';
import { HttpClient } from './client/http.js';

class RemoteSource extends BaseSource {
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
    } else if (this.maxRanges > 0 && slices.length > 1) {
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
    return Promise.all(
      slices.map((slice) => this.fetchSlice(slice, signal)),
    );
  }

  async fetchSlices(slices, signal) {
    const response = await this.client.request({
      headers: {
        ...this.headers,
        Range: `bytes=${slices
          .map(({ offset, length }) => `${offset}-${offset + length}`)
          .join(',')
        }`,
      },
      signal,
    });

    if (!response.ok) {
      throw new Error('Error fetching data.');
    } else if (response.status === 206) {
      const { type, params } = parseContentType(response.getHeader('content-type'));
      if (type === 'multipart/byteranges') {
        const byteRanges = parseByteRanges(await response.getData(), params.boundary);
        this._fileSize = byteRanges[0].fileSize || null;
        return byteRanges;
      }

      const data = await response.getData();

      const { start, end, total } = parseContentRange(response.getHeader('content-range'));
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
    } else {
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
    } else if (response.status === 206) {
      const data = await response.getData();

      const { total } = parseContentRange(response.getHeader('content-range'));
      this._fileSize = total || null;
      return {
        data,
        offset,
        length,
      };
    } else {
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
  return new BlockedSource(source, { blockSize, cacheSize });
}

export function makeFetchSource(url, { headers = {}, credentials, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
  const client = new FetchClient(url, credentials);
  const source = new RemoteSource(client, headers, maxRanges, allowFullFile);
  return maybeWrapInBlockedSource(source, blockOptions);
}

export function makeXHRSource(url, { headers = {}, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
  const client = new XHRClient(url);
  const source = new RemoteSource(client, headers, maxRanges, allowFullFile);
  return maybeWrapInBlockedSource(source, blockOptions);
}

export function makeHttpSource(url, { headers = {}, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
  const client = new HttpClient(url);
  const source = new RemoteSource(client, headers, maxRanges, allowFullFile);
  return maybeWrapInBlockedSource(source, blockOptions);
}

export function makeCustomSource(client, { headers = {}, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
  const source = new RemoteSource(client, headers, maxRanges, allowFullFile);
  return maybeWrapInBlockedSource(source, blockOptions);
}

/**
 *
 * @param {string} url
 * @param {object} options
 */
export function makeRemoteSource(url, { forceXHR = false, ...clientOptions } = {}) {
  if (typeof fetch === 'function' && !forceXHR) {
    return makeFetchSource(url, clientOptions);
  }
  if (typeof XMLHttpRequest !== 'undefined') {
    return makeXHRSource(url, clientOptions);
  }
  return makeHttpSource(url, clientOptions);
}
