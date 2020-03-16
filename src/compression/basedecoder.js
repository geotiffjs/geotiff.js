import { applyPredictor } from '../predictor';

export default class BaseDecoder {
  decode(fileDirectory, buffer) {
    const isTiled = !fileDirectory.StripOffsets;
    const tileWidth = isTiled ? fileDirectory.TileWidth : fileDirectory.ImageWidth;
    const tileHeight = isTiled ? fileDirectory.TileLength : (
      fileDirectory.RowsPerStrip || fileDirectory.ImageLength
    );
    const decoded = this.decodeBlock(buffer, tileWidth, tileHeight);
    const predictor = fileDirectory.Predictor || 1;
    if (predictor !== 1) {
      return applyPredictor(
        decoded, predictor, tileWidth, tileHeight, fileDirectory.BitsPerSample,
        fileDirectory.PlanarConfiguration,
      );
    }
    return decoded;
  }
}
