export default class GeoTIFFBase {
  /**
   * (experimental) Reads raster data from the best fitting image. This function uses
   * the image with the lowest resolution that is still a higher resolution than the
   * requested resolution.
   * When specified, the `bbox` option is translated to the `window` option and the
   * `resX` and `resY` to `width` and `height` respectively.
   * Then, the [readRasters]{@link GeoTIFFImage#readRasters} method of the selected
   * image is called and the result returned.
   * @see GeoTIFFImage.readRasters
   * @param {Object} [options={}] optional parameters
   * @param {Array} [options.window=whole image] the subset to read data from.
   * @param {Array} [options.bbox=whole image] the subset to read data from in
   *                                           geographical coordinates.
   * @param {Array} [options.samples=all samples] the selection of samples to read from.
   * @param {Boolean} [options.interleave=false] whether the data shall be read
   *                                             in one single array or separate
   *                                             arrays.
   * @param {Number} [options.pool=null] The optional decoder pool to use.
   * @param {Number} [options.width] The desired width of the output. When the width is not the
   *                                 same as the images, resampling will be performed.
   * @param {Number} [options.height] The desired height of the output. When the width is not the
   *                                  same as the images, resampling will be performed.
   * @param {String} [options.resampleMethod='nearest'] The desired resampling method.
   * @param {Number|Number[]} [options.fillValue] The value to use for parts of the image
   *                                              outside of the images extent. When multiple
   *                                              samples are requested, an array of fill values
   *                                              can be passed.
   * @returns {Promise.<(TypedArray|TypedArray[])>} the decoded arrays as a promise
   */
  async readRasters(options = {}) {
    const { window: imageWindow, width, height } = options;
    let { resX, resY, bbox } = options;

    const firstImage = await this.getImage();
    let usedImage = firstImage;
    const imageCount = await this.getImageCount();
    const imgBBox = firstImage.getBoundingBox();

    if (imageWindow && bbox) {
      throw new Error('Both "bbox" and "window" passed.');
    }

    // if width/height is passed, transform it to resolution
    if (width || height) {
      // if we have an image window (pixel coordinates), transform it to a BBox
      // using the origin/resolution of the first image.
      if (imageWindow) {
        const [oX, oY] = firstImage.getOrigin();
        const [rX, rY] = firstImage.getResolution();

        bbox = [
          oX + (imageWindow[0] * rX),
          oY + (imageWindow[1] * rY),
          oX + (imageWindow[2] * rX),
          oY + (imageWindow[3] * rY),
        ];
      }

      // if we have a bbox (or calculated one)

      const usedBBox = bbox || imgBBox;

      if (width) {
        if (resX) {
          throw new Error('Both width and resX passed');
        }
        resX = (usedBBox[2] - usedBBox[0]) / width;
      }
      if (height) {
        if (resY) {
          throw new Error('Both width and resY passed');
        }
        resY = (usedBBox[3] - usedBBox[1]) / height;
      }
    }

    // if resolution is set or calculated, try to get the image with the worst acceptable resolution
    if (resX || resY) {
      const allImages = [];
      for (let i = 0; i < imageCount; ++i) {
        const image = await this.getImage(i);
        const { SubfileType: subfileType, NewSubfileType: newSubfileType } = image.fileDirectory;
        if (i === 0 || subfileType === 2 || newSubfileType & 1) {
          allImages.push(image);
        }
      }

      allImages.sort((a, b) => a.getWidth() - b.getWidth());
      for (let i = 0; i < allImages.length; ++i) {
        const image = allImages[i];
        const imgResX = (imgBBox[2] - imgBBox[0]) / image.getWidth();
        const imgResY = (imgBBox[3] - imgBBox[1]) / image.getHeight();

        usedImage = image;
        if ((resX && resX > imgResX) || (resY && resY > imgResY)) {
          break;
        }
      }
    }

    let wnd = imageWindow;
    if (bbox) {
      const [oX, oY] = firstImage.getOrigin();
      const [imageResX, imageResY] = usedImage.getResolution(firstImage);

      wnd = [
        Math.round((bbox[0] - oX) / imageResX),
        Math.round((bbox[1] - oY) / imageResY),
        Math.round((bbox[2] - oX) / imageResX),
        Math.round((bbox[3] - oY) / imageResY),
      ];
      wnd = [
        Math.min(wnd[0], wnd[2]),
        Math.min(wnd[1], wnd[3]),
        Math.max(wnd[0], wnd[2]),
        Math.max(wnd[1], wnd[3]),
      ];
    }

    return usedImage.readRasters(Object.assign({}, options, {
      window: wnd,
    }));
  }
}
