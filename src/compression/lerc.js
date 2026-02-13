import { inflate } from 'pako';
// @ts-expect-error
import Lerc from 'lerc';
import { ZSTDDecoder } from 'zstddec';
import BaseDecoder from './basedecoder.js';
import { LercParameters, LercAddCompression } from '../globals.js';

/**
 * @typedef {import('./basedecoder.js').BaseDecoderParameters & { LercParameters?: any }} LercDecoderParameters
 */

export const zstd = new ZSTDDecoder();

export default class LercDecoder extends BaseDecoder {
  /**
   * @param {ArrayBufferLike} buffer
   * @returns {ArrayBufferLike}
   */
  decodeBlock(buffer) {
    const params = /** @type {LercDecoderParameters} */(this.parameters);
    const addCompression = params.LercParameters?.[LercParameters.AddCompression];

    /** @type {ArrayBufferLike} */
    let decoded = buffer;
    switch (addCompression) {
      case LercAddCompression.None:
        break;
      case LercAddCompression.Deflate:
        decoded = inflate(new Uint8Array(decoded)).buffer;
        break;
      case LercAddCompression.Zstandard:
        decoded = zstd.decode(new Uint8Array(decoded)).buffer;
        break;
      default:
        throw new Error(`Unsupported LERC additional compression method identifier: ${addCompression}`);
    }

    const lercResult = Lerc.decode(decoded, { returnPixelInterleavedDims: this.parameters.planarConfiguration === 1 });
    const lercData = lercResult.pixels[0];
    return lercData.buffer;
  }
}
