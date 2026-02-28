import { ZSTDDecoder } from 'zstddec/stream';
import BaseDecoder from './basedecoder.js';

export const zstd = new ZSTDDecoder();

export default class ZstdDecoder extends BaseDecoder {
  /** @param {ArrayBuffer} buffer */
  decodeBlock(buffer) {
    return /** @type {ArrayBuffer} */ (zstd.decode(new Uint8Array(buffer)).buffer);
  }
}
