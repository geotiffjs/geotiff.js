import { ZSTDDecoder } from 'zstddec/stream';
import BaseDecoder from './basedecoder.js';

export const zstd = new ZSTDDecoder();

export default class ZstdDecoder extends BaseDecoder {
  decodeBlock(buffer) {
    return zstd.decode(new Uint8Array(buffer)).buffer;
  }
}
