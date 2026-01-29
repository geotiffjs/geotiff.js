import { applyPredictor } from '../predictor.js';

export default class BaseDecoder {
  constructor(parameters) {
    this.parameters = parameters;
  }

  /**
   * @abstract
   */
  decodeBlock(_buffer) {
    throw new Error('decodeBlock not implemented');
  }

  async decode(buffer) {
    const decoded = await this.decodeBlock(buffer);

    const {
      tileWidth, tileHeight, predictor, bitsPerSample, planarConfiguration,
    } = this.parameters;
    if (predictor !== 1) {
      return applyPredictor(
        decoded, predictor, tileWidth, tileHeight, bitsPerSample,
        planarConfiguration,
      );
    }
    return decoded;
  }
}
