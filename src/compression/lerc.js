import { inflate } from 'pako';
import Lerc from 'lerc';
import { ZSTDDecoder } from 'zstddec';
import BaseDecoder from './basedecoder.js';
import { LercParameters, LercAddCompression } from '../globals.js';

export const zstd = new ZSTDDecoder();

export default class LercDecoder extends BaseDecoder {
  decodeBlock(buffer) {
    const addCompression = this.parameters.LercParameters[LercParameters.AddCompression];
    switch (addCompression) {
      case LercAddCompression.None:
        break;
      case LercAddCompression.Deflate:
        buffer = inflate(new Uint8Array(buffer)).buffer; // eslint-disable-line no-param-reassign, prefer-destructuring
        break;
      case LercAddCompression.Zstandard:
        buffer = zstd.decode(new Uint8Array(buffer)).buffer; // eslint-disable-line no-param-reassign, prefer-destructuring
        break;
      default:
        throw new Error(`Unsupported LERC additional compression method identifier: ${addCompression}`);
    }

    const lercResult = Lerc.decode(buffer, { returnPixelInterleavedDims: this.parameters.planarConfiguration === 1 });
    const lercData = lercResult.pixels[0];
    return lercData.buffer;
  }
}
