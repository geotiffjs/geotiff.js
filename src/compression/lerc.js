import { inflate } from 'pako';
import { ZSTDDecoder } from 'zstddec';
import BaseDecoder from './basedecoder.js';
import loadLerc from './lerc-node.cjs';
import { LercParameters, LercAddCompression } from '../globals.js';

/**
 * @typedef {import('./basedecoder.js').BaseDecoderParameters & { LercParameters?: any }} LercDecoderParameters
 */

export const zstd = new ZSTDDecoder();

export default class LercDecoder extends BaseDecoder {
  /**
   * @param {ArrayBufferLike} buffer
   * @returns {Promise<ArrayBuffer>}
   */
  async decodeBlock(buffer) {
    const params = /** @type {LercDecoderParameters} */(this.parameters);
    const addCompression = params.LercParameters?.[LercParameters.AddCompression];

    let decoded = new Uint8Array(buffer);
    switch (addCompression) {
      case LercAddCompression.None:
        break;
      case LercAddCompression.Deflate:
        decoded = inflate(decoded);
        break;
      case LercAddCompression.Zstandard:
        decoded = zstd.decode(decoded);
        break;
      default:
        throw new Error(`Unsupported LERC additional compression method identifier: ${addCompression}`);
    }

    const decode = await loadLerc();
    const { pixels: [pixels] } = decode(decoded, {
      returnInterleaved: this.parameters.planarConfiguration === 1,
    });
    const { buffer: pixelBuffer, byteOffset, byteLength } = pixels;
    // Lerc can return a view into a buffer shared by multiple bands.
    return byteLength === pixelBuffer.byteLength
      ? pixelBuffer
      : pixelBuffer.slice(byteOffset, byteOffset + byteLength);
  }
}
