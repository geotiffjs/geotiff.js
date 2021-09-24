import BaseDecoder from './basedecoder.mjs';


export default class RawDecoder extends BaseDecoder {
  decodeBlock(buffer) {
    return buffer;
  }
}
