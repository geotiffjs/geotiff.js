import { applyPredictor } from '../predictor.js';

export default class BaseDecoder {
  async decode(fileDirectory, buffer) {
    const decoded = await this.decodeBlock(buffer);
    const predictor = fileDirectory.getValue('Predictor') || 1;
    if (predictor !== 1) {
      const isTiled = !fileDirectory.hasTag('StripOffsets');
      const tileWidth = isTiled ? fileDirectory.getValue('TileWidth') : fileDirectory.getValue('ImageWidth');
      const tileHeight = isTiled ? fileDirectory.getValue('TileLength') : (
        fileDirectory.getValue('RowsPerStrip') || fileDirectory.getValue('ImageLength')
      );
      return applyPredictor(
        decoded, predictor, tileWidth, tileHeight, fileDirectory.getValue('BitsPerSample'),
        fileDirectory.getValue('PlanarConfiguration'),
      );
    }
    return decoded;
  }
}
