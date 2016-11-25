import AbstractDecoder from '../abstractdecoder';

export default class DeflateDecoder extends AbstractDecoder {
  decodeBlock() {
    throw new Error('not supported');
  }
}
