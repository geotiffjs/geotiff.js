"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const predictor_js_1 = require("../predictor.js");
class BaseDecoder {
    async decode(fileDirectory, buffer) {
        const decoded = await this.decodeBlock(buffer);
        const predictor = fileDirectory.Predictor || 1;
        if (predictor !== 1) {
            const isTiled = !fileDirectory.StripOffsets;
            const tileWidth = isTiled ? fileDirectory.TileWidth : fileDirectory.ImageWidth;
            const tileHeight = isTiled ? fileDirectory.TileLength : (fileDirectory.RowsPerStrip || fileDirectory.ImageLength);
            return (0, predictor_js_1.applyPredictor)(decoded, predictor, tileWidth, tileHeight, fileDirectory.BitsPerSample, fileDirectory.PlanarConfiguration);
        }
        return decoded;
    }
}
exports.default = BaseDecoder;
//# sourceMappingURL=basedecoder.js.map