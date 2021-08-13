import { decompress } from 'lzw-tiff-decoder';

import BaseDecoder from './basedecoder';

export default class LZWDecoder extends BaseDecoder {
  constructor(fileDirectory) {
    super();
    const width = fileDirectory.TileWidth || fileDirectory.ImageWidth;
    const height = fileDirectory.TileLength || fileDirectory.ImageLength;
    const nbytes = fileDirectory.BitsPerSample[0] / 8;
    this.maxUncompressedSize = width * height * nbytes;
  }

  async decodeBlock(buffer) {
    const bytes = new Uint8Array(buffer);
    const decoded = await decompress(bytes, this.maxUncompressedSize);
    return decoded.buffer;
  }
}

