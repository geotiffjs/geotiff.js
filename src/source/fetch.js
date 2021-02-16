import { parseByteRanges, parseContentRange, parseContentType } from './httputils';
import { BaseSource } from './basesource';
import { BlockedSource } from './blockedsource';

class FetchSource extends BaseSource {
  /**
   *
   * @param {string} url
   * @param {object} headers
   * @param {numbers} maxRanges
   * @param {boolean} allowFullFile
   * @param {string} credentials
   */
  constructor(url, headers, maxRanges, allowFullFile, credentials) {
    super();
    this.url = url;
    this.headers = headers;
    this.maxRanges = maxRanges;
    this.allowFullFile = allowFullFile;
    this.credentials = credentials;
    this._fileSize = null;
  }

  /**
   *
   * @param {Slice[]} slices
   */
  async fetch(slices, signal) {
    // if we allow multi-ranges, split the incoming request into that many sub-requests
    // and join them afterwards
    if (this.maxRanges > 1) {
      const subSlices = [];
      for (let i = 0; i < slices.length; i += this.maxRanges) {
        subSlices.push(
          this.fetchSlices(slices.slice(i, i + this.maxRanges), signal),
        );
      }
      return subSlices.flat();
    }

    // otherwise make a single request for each slice
    return slices.map((slice) => this.fetchSlice(slice, signal));
  }

  async fetchSlices(slices, signal) {
    const response = await fetch(
      this.url, {
        headers: {
          ...this.headers,
          Range: `bytes=${slices
            .map(({ offset, length }) => `${offset}-${offset + length}`)
            .join(', ')
          }`,
        },
        credentials: this.credentials,
        signal,
      },
    );

    if (!response.ok) {
      throw new Error('Error fetching data.');
    } else if (response.status === 206) {
      const { type, params } = parseContentType(response.headers.get('content-type'));
      if (type === 'multipart/byteranges') {
        const byteRanges = parseByteRanges(await response.arrayBuffer(), params.boundary);
        this._fileSize = byteRanges[0].fileSize || null;
        return byteRanges;
      }
      const data = response.arrayBuffer
        ? await response.arrayBuffer() : (await response.buffer()).buffer;

      const { start, end, total } = parseContentRange(response.headers.get('content-range'));
      this._fileSize = total || null;
      return [{
        data,
        offset: start,
        length: end - start,
      }];
    } else {
      if (!this.allowFullFile) {
        throw new Error('Server responded with full file');
      }
      const data = response.arrayBuffer
        ? await response.arrayBuffer() : (await response.buffer()).buffer;
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
    const response = await fetch(this.url, {
      headers: {
        ...this.headers,
        Range: `bytes=${offset}-${offset + length - 1}`,
      },
      credentials: this.credentials,
      signal,
    });

    // check the response was okay and if the server actually understands range requests
    if (!response.ok) {
      throw new Error('Error fetching data.');
    } else if (response.status === 206) {
      const data = response.arrayBuffer
        ? await response.arrayBuffer() : (await response.buffer()).buffer;

      const { total } = parseContentRange(response.headers.get('Content-Range'));
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

      const data = response.arrayBuffer
        ? await response.arrayBuffer() : (await response.buffer()).buffer;

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

/**
 *
 * @param {string} url
 * @param {object} options
 */
export function makeFetchSource(
  url, {
    headers = {},
    maxRanges = 0,
    allowFullFile = false,
    credentials = undefined,
    blockSize = undefined,
    cacheSize = undefined,
  } = {}) {
  const fetchSource = new FetchSource(url, headers, maxRanges, allowFullFile, credentials);
  if (blockSize === null) {
    return fetchSource;
  }
  return new BlockedSource(fetchSource, blockSize, cacheSize);
}
