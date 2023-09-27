"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const basedecoder_js_1 = __importDefault(require("./basedecoder.js"));
/**
 * class WebImageDecoder
 *
 * This decoder uses the browsers image decoding facilities to read image
 * formats like WebP when supported.
 */
class WebImageDecoder extends basedecoder_js_1.default {
    constructor() {
        super();
        if (typeof createImageBitmap === 'undefined') {
            throw new Error('Cannot decode WebImage as `createImageBitmap` is not available');
        }
        else if (typeof document === 'undefined' && typeof OffscreenCanvas === 'undefined') {
            throw new Error('Cannot decode WebImage as neither `document` nor `OffscreenCanvas` is not available');
        }
    }
    async decode(fileDirectory, buffer) {
        const blob = new Blob([buffer]);
        const imageBitmap = await createImageBitmap(blob);
        let canvas;
        if (typeof document !== 'undefined') {
            canvas = document.createElement('canvas');
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
        }
        else {
            canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        }
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageBitmap, 0, 0);
        // TODO: check how many samples per pixel we have, and return RGB/RGBA accordingly
        // it seems like GDAL always encodes via RGBA which does not require a translation
        return ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height).data.buffer;
    }
}
exports.default = WebImageDecoder;
//# sourceMappingURL=webimage.js.map