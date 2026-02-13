import BaseDecoder from './basedecoder.js';

export default class RawDecoder extends BaseDecoder {
  /** @param {ArrayBuffer} buffer */
  decodeBlock(buffer) {
    return buffer;
  }
}
