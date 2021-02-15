import { Buffer } from 'buffer';
import { open, read, close } from 'fs';
import http from 'http';
import https from 'https';
import urlMod from 'url';
import LRUCache from 'lru-cache';
import { parseContentType, parseByteRanges, parseContentRange } from './httputils';

import { parseContentRange } from './utils';


function readRangeFromBlocks(blocks, rangeOffset, rangeLength) {
  const rangeTop = rangeOffset + rangeLength;
  const rangeData = new ArrayBuffer(rangeLength);
  const rangeView = new Uint8Array(rangeData);

  for (const block of blocks) {
    const delta = block.offset - rangeOffset;
    const topDelta = block.top - rangeTop;
    let blockInnerOffset = 0;
    let rangeInnerOffset = 0;
    let usedBlockLength;

    if (delta < 0) {
      blockInnerOffset = -delta;
    } else if (delta > 0) {
      rangeInnerOffset = delta;
    }

    if (topDelta < 0) {
      usedBlockLength = block.length - blockInnerOffset;
    } else {
      usedBlockLength = rangeTop - block.offset - blockInnerOffset;
    }

    const blockView = new Uint8Array(block.data, blockInnerOffset, usedBlockLength);
    rangeView.set(blockView, rangeInnerOffset);
  }

  return rangeData;
}

/**
 * Interface for Source objects.
 * @interface Source
 */

/**
 * @function Source#fetch
 * @summary The main method to retrieve the data from the source.
 * @param {number} offset The offset to read from in the source
 * @param {number} length The requested number of bytes
 */

/**
 * @typedef {object} Block
 * @property {ArrayBuffer} data The actual data of the block.
 * @property {number} offset The actual offset of the block within the file.
 * @property {number} length The actual size of the block in bytes.
 */

/**
 * Callback type for sources to request patches of data.
 * @callback requestCallback
 * @async
 * @param {number} offset The offset within the file.
 * @param {number} length The desired length of data to be read.
 * @returns {Promise<Block>} The block of data.
 */

/**
 * @module source
 */

/*
 * Split a list of identifiers to form groups of coherent ones
 */
function getCoherentBlockGroups(blockIds) {
  if (blockIds.length === 0) {
    return [];
  }

  const groups = [];
  let current = [];
  groups.push(current);

  for (let i = 0; i < blockIds.length; ++i) {
    if (i === 0 || blockIds[i] === blockIds[i - 1] + 1) {
      current.push(blockIds[i]);
    } else {
      current = [blockIds[i]];
      groups.push(current);
    }
  }
  return groups;
}


/*
 * Promisified wrapper around 'setTimeout' to allow 'await'
 */
async function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * BlockedSource - an abstraction of (remote) files.
 * @implements Source
 */
class BlockedSource {
  /**
   * @param {requestCallback} retrievalFunction Callback function to request data
   * @param {object} options Additional options
   * @param {object} options.blockSize Size of blocks to be fetched
   */
  constructor(retrievalFunction, { blockSize = 65536, multiRanges = false, maxRanges = 2, cacheSize = 100 } = {}) {
    this.retrievalFunction = retrievalFunction;
    this.blockSize = blockSize;
    this.multiRanges = multiRanges;
    this.maxRanges = maxRanges;

    this.blocks = new LRUCache({
      max: cacheSize,
    });
    // block ids waiting for a batched request. Either a Set or null
    this.blockIdsAwaitingRequest = null;

    // file size to not read over. To be set when first response was set
    this.fileSize = null;
  }

  /**
   * Fetch a subset of the file.
   * @param {number} offset The offset within the file to read from.
   * @param {number} length The length in bytes to read from.
   * @returns {ArrayBuffer} The subset of the file.
   */
  async fetch(offset, length, immediate = false) {
    let top = offset + length;
    if (this.fileSize !== null) {
      top = Math.min(top, this.fileSize);
    }

    // calculate what blocks intersect the specified range (offset + length)
    // determine what blocks are already stored or beeing requested
    const firstBlockOffset = Math.floor(offset / this.blockSize) * this.blockSize;
    const allBlockIds = [];
    const missingBlockIds = [];
    const blockRequests = [];

    for (let current = firstBlockOffset; current < top; current += this.blockSize) {
      const blockId = Math.floor(current / this.blockSize);
      if (!this.blocks.has(blockId) && !this.blockRequests.has(blockId)) {
        missingBlockIds.push(blockId);
      }
      if (this.blockRequests.has(blockId)) {
        blockRequests.push(this.blockRequests.get(blockId));
      }
      allBlockIds.push(blockId);
    }

    await wait();
    this.fetchMissingBlocks();

    await Promise.all(
      intersectingBlocks
        .filter(block => !block.finished)
        .map(block => block.fetch()),
    );
    return readRangeFromBlocks(intersectingBlocks, offset, length);
  }

  async fetchMissingBlocks() {
    // get coherent groups of blocks, i.e single ranges of bytes with no holes between
    // and convert them to byteranges
    const groups = this.getCoherentBlockGroups(this.blocksToFetch);
    let ranges = groups.map(group => ({
      group,
      offset: group[0].offset,
      length: group[group.length - 1].offset + group[0].blockSize,
    }));

    if (this.multiRanges && ranges.length) {
      while (ranges.length) {
        const requestRanges = ranges.slice(0, this.maxRanges);
        ranges = ranges.slice(this.maxRanges);
        // groups to ranges:
        const request = this.retrievalFunction(requestRanges);

        for (const range of requestRanges) {
          for (const block of range.group) {
            block.setSourcSliceRequest(request);
          }
        }
      }
    } else {
      for (let i = 0; i < missingBlockIds.length; ++i) {
        const id = missingBlockIds[i];
        this.blockIdsAwaitingRequest.add(id);
      }
    }

    // in immediate mode, we don't want to wait for possible additional requests coming in
    if (!immediate) {
      await wait();
    }

    // determine if we are the thread to start the requests.
    if (this.blockIdsAwaitingRequest) {
      // get all coherent blocks as groups to be requested in a single request
      const groups = getCoherentBlockGroups(
        Array.from(this.blockIdsAwaitingRequest).sort(),
      );

      // iterate over all blocks
      for (const group of groups) {
        // fetch a group as in a single request
        const request = this.requestData(
          group[0] * this.blockSize, group.length * this.blockSize,
        );

        // for each block in the request, make a small 'splitter',
        // i.e: wait for the request to finish, then cut out the bytes for
        // that block and store it there.
        // we keep that as a promise in 'blockRequests' to allow waiting on
        // a single block.
        for (let i = 0; i < group.length; ++i) {
          const id = group[i];
          this.blockRequests.set(id, (async () => {
            const response = await request;
            const o = i * this.blockSize;
            const t = Math.min(o + this.blockSize, response.data.byteLength);
            const data = response.data.slice(o, t);
            if (this.fileSize === null && response.fileSize) {
              this.fileSize = response.fileSize;
            }
            this.blockRequests.delete(id);
            this.blocks.set(id, {
              data,
              offset: response.offset + o,
              length: data.byteLength,
              top: response.offset + t,
            });
          })());
        }
      }
    }
    this.blocksToFetch = [];
  }


  getCoherentBlockGroups(blocks) {
    if (blocks.length === 0) {
      return [];
    }
    blocks.sort((a, b) => a.id - b.id);
    const groups = [];
    let currentGroup = [];
    let lastBlock = null;

    groups.push(currentGroup);

    for (const block of blocks) {
      if (!lastBlock || lastBlock.id + 1 === block.id) {
        currentGroup.push(block);
      } else {
        currentGroup = [block];
        groups.push(currentGroup);
      }
    }

    // wait for all missing requests to finish
    await Promise.all(missingRequests);
    await Promise.all(blockRequests);

    // now get all blocks for the request and return a summary buffer
    const blocks = allBlockIds.map((id) => this.blocks.get(id));
    return readRangeFromBlocks(blocks, offset, length);
  }

  async requestData(requestedOffset, requestedLength) {
    const response = await this.retrievalFunction(requestedOffset, requestedLength);
    if (!response.length) {
      response.length = response.data.byteLength;
    } else if (response.length !== response.data.byteLength) {
      response.data = response.data.slice(0, response.length);
    }
    response.top = response.offset + response.length;
    return response;
  }
}

/**
 * Create a new source to read from a remote file using the
 * [fetch]{@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} API.
 * @param {string} url The URL to send requests to.
 * @param {Object} [options] Additional options.
 * @param {Number} [options.blockSize] The block size to use.
 * @param {object} [options.headers] Additional headers to be sent to the server.
 * @returns The constructed source
 */
export function makeFetchSource(url, { headers = {}, blockSize, maxRanges = 0, allowFullFile, credentials = undefined } = {}) {
  if (maxRanges) {
    return new BlockedSource(async (ranges) => {
      const response = await fetch(url, {
        headers: {
          ...headers,
          Range: `bytes=${ranges
              .map(({ offset, length }) => `${offset}-${offset + length}`)
              .join(', ')
            }`,
          }
        ),
        credentials,
      });

      if (!response.ok) {
        throw new Error('Error fetching data.');
      } else if (response.status === 206) {
        const { type, params } = parseContentType(response.headers.get('content-type'));
        if (type === 'multipart/byteranges') {
          return parseByteRanges(await response.arrayBuffer(), params.boundary);
        }
        const data = response.arrayBuffer ?
          await response.arrayBuffer() : (await response.buffer()).buffer;

        const { start, end } = parseContentRange(response.headers.get('content-range'));
        return [{
          data,
          offset: start,
          length: end - start,
        }];
      } else {
        if (!allowFullFile) {
          throw new Error('Server responded with full file');
        }
        const data = response.arrayBuffer ?
          await response.arrayBuffer() : (await response.buffer()).buffer;
        return [{
          data,
          offset: 0,
          length: data.byteLength,
          fileSize: data.byteLength,
        }];
      }
    }, { blockSize, multiRanges: (maxRanges !== 0), maxRanges });
  }
  return new BlockedSource(async (offset, length) => {
    const response = await fetch(url, {
      headers: {
        ...headers, Range: `bytes=${offset}-${offset + length - 1}`,
      },
    });

    // check the response was okay and if the server actually understands range requests
    if (!response.ok) {
      throw new Error('Error fetching data.');
    } else if (response.status === 206) {
      const data = response.arrayBuffer
        ? await response.arrayBuffer() : (await response.buffer()).buffer;

      const contentRange = parseContentRange(response.headers.get('Content-Range'));
      let fileSize;
      if (contentRange !== null) {
        fileSize = contentRange.length;
      }
      return {
        data,
        offset,
        length,
        fileSize,
      };
    } else {
      if (!allowFullFile) {
        throw new Error('Server responded with full file');
      }

      const data = response.arrayBuffer ?
        await response.arrayBuffer() : (await response.buffer()).buffer;
      return {
        data,
        offset: 0,
        length: data.byteLength,
        fileSize: data.byteLength,
      };
    }
  }, { blockSize });
}

/**
 * Create a new source to read from a remote file using the
 * [XHR]{@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest} API.
 * @param {string} url The URL to send requests to.
 * @param {Object} [options] Additional options.
 * @param {Number} [options.blockSize] The block size to use.
 * @param {object} [options.headers] Additional headers to be sent to the server.
 * @returns The constructed source
 */
export function makeXHRSource(url, { headers = {}, blockSize } = {}) {
  return new BlockedSource(async (offset, length) => {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', url);
      request.responseType = 'arraybuffer';
      const requestHeaders = { ...headers, Range: `bytes=${offset}-${offset + length - 1}` };
      for (const [key, value] of Object.entries(requestHeaders)) {
        request.setRequestHeader(key, value);
      }

      request.onload = () => {
        const data = request.response;
        if (request.status === 206) {
          const contentRange = parseContentRange(request.getResponseHeader('Content-Range'));
          let fileSize;
          if (contentRange !== null) {
            fileSize = contentRange.length;
          }
          resolve({
            data,
            offset,
            length,
            fileSize,
          });
        } else {
          resolve({
            data,
            offset: 0,
            length: data.byteLength,
            fileSize: data.byteLength,
          });
        }
      };
      request.onerror = reject;
      request.send();
    });
  }, { blockSize });
}

/**
 * Create a new source to read from a remote file using the node
 * [http]{@link https://nodejs.org/api/http.html} API.
 * @param {string} url The URL to send requests to.
 * @param {Object} [options] Additional options.
 * @param {Number} [options.blockSize] The block size to use.
 * @param {object} [options.headers] Additional headers to be sent to the server.
 */
export function makeHttpSource(url, { headers = {}, blockSize } = {}) {
  return new BlockedSource(async (offset, length) => new Promise((resolve, reject) => {
    const parsed = urlMod.parse(url);
    const request = (parsed.protocol === 'http:' ? http : https).get(
      {
        ...parsed,
        headers: {
          ...headers, Range: `bytes=${offset}-${offset + length - 1}`,
        },
      },
      (result) => {
        const contentRange = parseContentRange(result.headers['content-range']);
        let fileSize;
        if (contentRange !== null) {
          fileSize = contentRange.length;
        }
        const chunks = [];
        // collect chunks
        result.on('data', (chunk) => {
          chunks.push(chunk);
        });

        // concatenate all chunks and resolve the promise with the resulting buffer
        result.on('end', () => {
          const data = Buffer.concat(chunks).buffer;
          resolve({
            data,
            offset,
            length: data.byteLength,
            fileSize,
          });
        });
      },
    );
    request.on('error', reject);
  }), { blockSize });
}

/**
 * Create a new source to read from a remote file. Uses either XHR, fetch or nodes http API.
 * @param {string} url The URL to send requests to.
 * @param {Object} [options] Additional options.
 * @param {Boolean} [options.forceXHR] Force the usage of XMLHttpRequest.
 * @param {Number} [options.blockSize] The block size to use.
 * @param {object} [options.headers] Additional headers to be sent to the server.
 * @returns The constructed source
 */
export function makeRemoteSource(url, options) {
  const { forceXHR } = options;
  if (typeof fetch === 'function' && !forceXHR) {
    return makeFetchSource(url, options);
  }
  if (typeof XMLHttpRequest !== 'undefined') {
    return makeXHRSource(url, options);
  }
  if (http.get) {
    return makeHttpSource(url, options);
  }
  throw new Error('No remote source available');
}

/**
 * Create a new source to read from a local
 * [ArrayBuffer]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer}.
 * @param {ArrayBuffer} arrayBuffer The ArrayBuffer to parse the GeoTIFF from.
 * @returns The constructed source
 */
export function makeBufferSource(arrayBuffer) {
  return {
    async fetch(offset, length) {
      return arrayBuffer.slice(offset, offset + length);
    },
  };
}

function closeAsync(fd) {
  return new Promise((resolve, reject) => {
    close(fd, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function openAsync(path, flags, mode = undefined) {
  return new Promise((resolve, reject) => {
    open(path, flags, mode, (err, fd) => {
      if (err) {
        reject(err);
      } else {
        resolve(fd);
      }
    });
  });
}

function readAsync(...args) {
  return new Promise((resolve, reject) => {
    read(...args, (err, bytesRead, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve({ bytesRead, buffer });
      }
    });
  });
}

/**
 * Creates a new source using the node filesystem API.
 * @param {string} path The path to the file in the local filesystem.
 * @returns The constructed source
 */
export function makeFileSource(path) {
  const fileOpen = openAsync(path, 'r');

  return {
    async fetch(offset, length) {
      const fd = await fileOpen;
      const { buffer } = await readAsync(fd, Buffer.alloc(length), 0, length, offset);
      return buffer.buffer;
    },
    async close() {
      const fd = await fileOpen;
      return await closeAsync(fd);
    },
  };
}

/**
 * Create a new source from a given file/blob.
 * @param {Blob} file The file or blob to read from.
 * @returns The constructed source
 */
export function makeFileReaderSource(file) {
  return {
    async fetch(offset, length) {
      return new Promise((resolve, reject) => {
        const blob = file.slice(offset, offset + length);
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    },
  };
}
