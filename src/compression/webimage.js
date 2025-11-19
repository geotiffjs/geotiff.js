import BaseDecoder from './basedecoder.js';

/**
 * class WebImageDecoder
 *
 * This decoder uses the browsers image decoding facilities to read image
 * formats like WebP when supported.
 */
export default class WebImageDecoder extends BaseDecoder {
  constructor() {
    super();
    if (typeof createImageBitmap === 'undefined') {
      throw new Error('Cannot decode WebImage as `createImageBitmap` is not available');
    } else if (typeof document === 'undefined' && typeof OffscreenCanvas === 'undefined') {
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
    } else {
      canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    }

    // Draw the image onto the canvas to extract the pixel data. Note this
    // always returns RGBA, even if the original image was RGB.
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height).data;

    // Return the correct channels to the caller
    const spp = fileDirectory.SamplesPerPixel || 4;
    if (spp === 4) {
      // RGBA, return as is
      return imageData.buffer;
    } else if (spp === 3) {
      // RGB, remove alpha channel before returning
      const rgb = new Uint8ClampedArray(imageBitmap.width * imageBitmap.height * 3);
      for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
        rgb[i    ] = imageData[j    ];
        rgb[i + 1] = imageData[j + 1];
        rgb[i + 2] = imageData[j + 2];
      }
      return rgb.buffer;
    } else {
      throw new Error(`Unsupported SamplesPerPixel value: ${spp}`);
    }
  }
}
