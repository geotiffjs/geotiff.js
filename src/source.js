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
    } else if (topDelta > 0) {
      usedBlockLength = rangeTop - block.offset - blockInnerOffset;
    }

    const blockView = new Uint8Array(block.data, blockInnerOffset, usedBlockLength);
    rangeView.set(blockView, rangeInnerOffset);
  }

  return rangeData;
}

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
 * BlockedSource - an abstraction of (remote) files.
 */
class BlockedSource {
  /**
   * @param {requestCallback} retrievalFunction Callback function to request data
   * @param {object} options Additional options
   * @param {object} options.blockSize Size of blocks to be fetched
   */
  constructor(retrievalFunction, { blockSize = 65535 } = {}) {
    this.retrievalFunction = retrievalFunction;
    this.blockSize = blockSize;

    this.blockRequests = new Map();
    this.blocks = new Map();
  }

  /**
   * Fetch a subset of the file.
   * @param {number} offset The offset within the file to read from.
   * @param {number} length The length in bytes to read from.
   * @returns {ArrayBuffer} The subset of the file.
   */
  async fetch(offset, length) {
    const top = offset + length;
    const blockIds = [];
    const firstBlockOffset = Math.floor(offset / this.blockSize) * this.blockSize;
    for (let current = firstBlockOffset; current < top; current += this.blockSize) {
      const blockId = Math.floor(current / this.blockSize);
      blockIds.push(blockId);
    }
    const blocks = await Promise.all(blockIds.map(blockId => this.fetchBlock(blockId)));
    return readRangeFromBlocks(blocks, offset, length);
  }

  /**
   * Fetch a single block, if it is not already within the cache.
   * @param {number} blockId The block identifier to fetch.
   * @returns {Promise<Block>} The requested block.
   */
  async fetchBlock(blockId) {
    let block = this.blocks.get(blockId);
    if (block) {
      return block;
    }
    let blockRequest = this.blockRequests.get(blockId);
    if (blockRequest) {
      return blockRequest;
    }

    // cache the request to fetch the block
    blockRequest = this.requestData(this.blockSize * blockId, this.blockSize);
    this.blockRequests.set(blockId, blockRequest);
    block = await blockRequest;
    this.blockRequests.delete(blockId);

    // cache the block itself
    this.blocks.set(blockId, block);
    return block;
  }

  async requestData(requestedOffset, requestedLength) {
    const response = await this.retrievalFunction(requestedOffset, requestedLength);
    if (!response.length) {
      response.length = response.data.byteLength;
    }
    response.top = response.offset + response.length;
    return response;
  }
}

/**
 * Create a new source to
 * @param {string} url The URL to send requests to.
 * @param {object} headers Additional headers to be sent to the server.
 */
export function makeFetchSource(url, headers) {
  return new BlockedSource(async (offset, length) => {
    const response = await fetch(url, {
      headers: Object.assign({},
        headers, {
          Range: `bytes=${offset}-${offset + length}`,
        },
      ),
    });

    // check the response was okay and if the server actually understands range requests
    if (!response.ok) {
      throw new Error('Error fetching data.');
    } else if (response.status === 206) {
      const data = await response.arrayBuffer();
      return {
        data,
        offset,
        length,
      };
    } else {
      const data = await response.arrayBuffer();
      return {
        data,
        offset: 0,
        length: data.byteLength,
      };
    }
  });
}

export function makeBufferSource(arrayBuffer) {
  return {
    async fetch(offset, length) {
      return arrayBuffer.slice(offset, offset + length);
    },
  };
}

export function makeFileSource(path) {
  const { promisify } = require('util');
  const { open, read } = require('fs');
  const openAsync = promisify(open);
  const readAsync = promisify(read);

  const fileOpen = openAsync(path, 'r');

  return {
    async fetch(offset, length) {
      const fd = await fileOpen;
      const { buffer } = await readAsync(fd, new Uint8Array(length), 0, length, offset);
      return buffer.buffer;
    },
  };
}
