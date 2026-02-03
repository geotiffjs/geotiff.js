import { applyPredictor } from '../predictor.js';

/**
 * @typedef {Object} BaseDecoderParameters
 * @property {number} tileWidth
 * @property {number} tileHeight
 * @property {number} predictor
 * @property {number|number[]|import('../geotiff.js').TypedArray} bitsPerSample
 * @property {number} planarConfiguration
 * @property {number} [samplesPerPixel]
 */

export default class BaseDecoder {
  /**
   * @param {BaseDecoderParameters} parameters
   */
  constructor(parameters) {
    this.parameters = parameters;
  }

  /**
   * @abstract
   * @param {ArrayBufferLike} _buffer
   * @returns {Promise<ArrayBuffer>|ArrayBuffer}
   */
  decodeBlock(_buffer) {
    throw new Error('decodeBlock not implemented');
  }

  /**
   * @param {ArrayBufferLike} buffer
   * @returns {Promise<ArrayBufferLike>}
   */
  async decode(buffer) {
    const decoded = await this.decodeBlock(buffer);

    const {
      tileWidth, tileHeight, predictor, bitsPerSample, planarConfiguration,
    } = this.parameters;
    if (predictor !== 1) {
      const isBitsPerSampleArray = Array.isArray(bitsPerSample) || ArrayBuffer.isView(bitsPerSample);
      const adaptedBitsPerSample = isBitsPerSampleArray ? Array.from(bitsPerSample) : [bitsPerSample];
      return applyPredictor(
        decoded, predictor, tileWidth, tileHeight, adaptedBitsPerSample,
        planarConfiguration,
      );
    }
    return decoded;
  }
}
