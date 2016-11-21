import RawDecoder from './raw.js';
import LZWDecoder from './lzw.js';
import DeflateDecoder from './deflate.js';
import PackbitsDecoder from './packbits.js';

export function getDecoder(compression) {
  switch (compression) {
    case undefined:
    case 1: // no compression
      return new RawDecoder();
    case 5: // LZW
      return new LZWDecoder();
    case 6: // JPEG
      throw new Error('JPEG compression not supported.');
    case 8: // Deflate
      return new DeflateDecoder();
    //case 32946: // deflate ??
    //  throw new Error("Deflate compression not supported.");
    case 32773: // packbits
      return new PackbitsDecoder();
    default:
      throw new Error(`Unknown compression method identifier: ${this.fileDirectory.Compression}`);
  }
}
