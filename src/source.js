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

export default class Source {
  constructor(retrievalFunction, data, { blockSize = 65535 } = {}) {
    this.retrievalFunction = retrievalFunction;
    this.data = data;
    this.blockSize = blockSize;

    this.blockRequests = new Map();
    this.blocks = new Map();

    if (data instanceof ArrayBuffer) {
      this.blockSize = data.byteLength;
    }
  }

  /**
   * 
   * @param {*} offset 
   * @param {*} length 
   */
  async fetch(offset, length) {
    const top = offset + length;
    const blockIds = [];
    const firstBlockOffset = Math.floor(offset / this.blockSize) * this.blockSize;
    for (let currentOffset = firstBlockOffset; currentOffset < top; currentOffset += this.blockSize) {
      const blockId = Math.floor(currentOffset / this.blockSize);
      blockIds.push(blockId);
    }
    const blocks = await Promise.all(blockIds.map(blockId => this.fetchBlock(blockId)));
    return readRangeFromBlocks(blocks, offset, length);
  }

  async fetchBlocks(blockIds) {
    
  }

  async fetchBlock(blockId) {
    let block = this.blocks.get(blockId);
    if (block) {
      return block;
    }
    let blockRequest = this.blockRequests.get(blockId);
    if (blockRequest) {
      return await blockRequest;
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



export function makeFetchSource(url, headers) {
  return new Source(async (offset, length) => {
    const response = await fetch(url, {
      headers: Object.assign({},
        headers, {
        Range: `bytes=${offset}-${offset + length}`,
      })
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