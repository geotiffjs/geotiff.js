import { ZSTDDecoder } from 'zstddec';
import BaseDecoder from './basedecoder.js';

export const zstd = new ZSTDDecoder();

export default class ZstdDecoder extends BaseDecoder {
  decodeBlock(buffer) {
    return zstd.decode(new Uint8Array(buffer), 1000_000_000).buffer;
  }
}
