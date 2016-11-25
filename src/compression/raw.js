import AbstractDecoder from '../abstractdecoder';

export default class RawDecoder extends AbstractDecoder {
  decodeBlock(buffer) {
    return Promise.resolve(buffer);
  }
}
