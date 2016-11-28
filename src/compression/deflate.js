import { inflate } from 'pako/lib/inflate';
import AbstractDecoder from '../abstractdecoder';


export default class DeflateDecoder extends AbstractDecoder {
  decodeBlock(buffer) {
    return Promise.resolve(inflate(new Uint8Array(buffer)).buffer);
  }
}
