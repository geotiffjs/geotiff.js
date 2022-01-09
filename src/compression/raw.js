import BaseDecoder from './basedecoder.js';

export default class RawDecoder extends BaseDecoder {
  decodeBlock(buffer) {
    return buffer;
  }
}
