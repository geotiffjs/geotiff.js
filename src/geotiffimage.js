import { photometricInterpretations, parseXml } from './globals';
import { fromWhiteIsZero, fromBlackIsZero, fromPalette, fromCMYK, fromYCbCr, fromCIELab } from './rgb';
import Pool from './pool';

function sum(array, start, end) {
  let s = 0;
  for (let i = start; i < end; ++i) {
    s += array[i];
  }
  return s;
}

function arrayForType(format, bitsPerSample, size) {
  switch (format) {
    case 1: // unsigned integer data
      switch (bitsPerSample) {
        case 8:
          return new Uint8Array(size);
        case 16:
          return new Uint16Array(size);
        case 32:
          return new Uint32Array(size);
        default:
          break;
      }
      break;
    case 2: // twos complement signed integer data
      switch (bitsPerSample) {
        case 8:
          return new Int8Array(size);
        case 16:
          return new Int16Array(size);
        case 32:
          return new Int32Array(size);
        default:
          break;
      }
      break;
    case 3: // floating point data
      switch (bitsPerSample) {
        case 32:
          return new Float32Array(size);
        case 64:
          return new Float64Array(size);
        default:
          break;
      }
      break;
    default:
      break;
  }
  throw Error('Unsupported data format/bitsPerSample');
}

/**
 * GeoTIFF sub-file image.
 */
class GeoTIFFImage {
  /**
   * @constructor
   * @param {Object} fileDirectory The parsed file directory
   * @param {Object} geoKeys The parsed geo-keys
   * @param {DataView} dataView The DataView for the underlying file.
   * @param {Boolean} littleEndian Whether the file is encoded in little or big endian
   * @param {Boolean} cache Whether or not decoded tiles shall be cached
   */
  constructor(fileDirectory, geoKeys, dataView, littleEndian, cache) {
    this.fileDirectory = fileDirectory;
    this.geoKeys = geoKeys;
    this.dataView = dataView;
    this.littleEndian = littleEndian;
    this.tiles = cache ? {} : null;
    this.isTiled = !fileDirectory.StripOffsets;
    const planarConfiguration = fileDirectory.PlanarConfiguration;
    this.planarConfiguration = (typeof planarConfiguration === 'undefined') ? 1 : planarConfiguration;
    if (this.planarConfiguration !== 1 && this.planarConfiguration !== 2) {
      throw new Error('Invalid planar configuration.');
    }
  }

  /**
   * Returns the associated parsed file directory.
   * @returns {Object} the parsed file directory
   */
  getFileDirectory() {
    return this.fileDirectory;
  }
   /**
   * Returns the associated parsed geo keys.
   * @returns {Object} the parsed geo keys
   */
  getGeoKeys() {
    return this.geoKeys;
  }
  /**
   * Returns the width of the image.
   * @returns {Number} the width of the image
   */
  getWidth() {
    return this.fileDirectory.ImageWidth;
  }
  /**
   * Returns the height of the image.
   * @returns {Number} the height of the image
   */
  getHeight() {
    return this.fileDirectory.ImageLength;
  }
  /**
   * Returns the number of samples per pixel.
   * @returns {Number} the number of samples per pixel
   */
  getSamplesPerPixel() {
    return this.fileDirectory.SamplesPerPixel;
  }
  /**
   * Returns the width of each tile.
   * @returns {Number} the width of each tile
   */
  getTileWidth() {
    return this.isTiled ? this.fileDirectory.TileWidth : this.getWidth();
  }
  /**
   * Returns the height of each tile.
   * @returns {Number} the height of each tile
   */
  getTileHeight() {
    return this.isTiled ? this.fileDirectory.TileLength : this.fileDirectory.RowsPerStrip;
  }

  /**
   * Calculates the number of bytes for each pixel across all samples. Only full
   * bytes are supported, an exception is thrown when this is not the case.
   * @returns {Number} the bytes per pixel
   */
  getBytesPerPixel() {
    let bitsPerSample = 0;
    for (let i = 0; i < this.fileDirectory.BitsPerSample.length; ++i) {
      const bits = this.fileDirectory.BitsPerSample[i];
      if ((bits % 8) !== 0) {
        throw new Error(`Sample bit-width of ${bits} is not supported.`);
      } else if (bits !== this.fileDirectory.BitsPerSample[0]) {
        throw new Error('Differing size of samples in a pixel are not supported.');
      }
      bitsPerSample += bits;
    }
    return bitsPerSample / 8;
  }

  getSampleByteSize(i) {
    if (i >= this.fileDirectory.BitsPerSample.length) {
      throw new RangeError(`Sample index ${i} is out of range.`);
    }
    const bits = this.fileDirectory.BitsPerSample[i];
    if ((bits % 8) !== 0) {
      throw new Error(`Sample bit-width of ${bits} is not supported.`);
    }
    return (bits / 8);
  }

  getReaderForSample(sampleIndex) {
    const format = this.fileDirectory.SampleFormat ?
      this.fileDirectory.SampleFormat[sampleIndex] : 1;
    const bitsPerSample = this.fileDirectory.BitsPerSample[sampleIndex];
    switch (format) {
      case 1: // unsigned integer data
        switch (bitsPerSample) {
          case 8:
            return DataView.prototype.getUint8;
          case 16:
            return DataView.prototype.getUint16;
          case 32:
            return DataView.prototype.getUint32;
          default:
            break;
        }
        break;
      case 2: // twos complement signed integer data
        switch (bitsPerSample) {
          case 8:
            return DataView.prototype.getInt8;
          case 16:
            return DataView.prototype.getInt16;
          case 32:
            return DataView.prototype.getInt32;
          default:
            break;
        }
        break;
      case 3:
        switch (bitsPerSample) {
          case 32:
            return DataView.prototype.getFloat32;
          case 64:
            return DataView.prototype.getFloat64;
          default:
            break;
        }
        break;
      default:
        break;
    }
    throw Error('Unsupported data format/bitsPerSample');
  }

  getArrayForSample(sampleIndex, size) {
    const format = this.fileDirectory.SampleFormat ?
      this.fileDirectory.SampleFormat[sampleIndex] : 1;
    const bitsPerSample = this.fileDirectory.BitsPerSample[sampleIndex];
    return arrayForType(format, bitsPerSample, size);
  }

  getDecoder() {
    return this.decoder;
  }

  /**
   * Returns the decoded strip or tile.
   * @param {Number} x the strip or tile x-offset
   * @param {Number} y the tile y-offset (0 for stripped images)
   * @param {Number} sample the sample to get for separated samples
   * @param {Pool} pool the decoder pool
   * @returns {Promise.<Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array>}
   */
  getTileOrStrip(x, y, sample, pool) {
    const numTilesPerRow = Math.ceil(this.getWidth() / this.getTileWidth());
    const numTilesPerCol = Math.ceil(this.getHeight() / this.getTileHeight());
    let index;
    const tiles = this.tiles;
    if (this.planarConfiguration === 1) {
      index = (y * numTilesPerRow) + x;
    } else if (this.planarConfiguration === 2) {
      index = (sample * numTilesPerRow * numTilesPerCol) + (y * numTilesPerRow) + x;
    }

    let offset;
    let byteCount;
    if (this.isTiled) {
      offset = this.fileDirectory.TileOffsets[index];
      byteCount = this.fileDirectory.TileByteCounts[index];
    } else {
      offset = this.fileDirectory.StripOffsets[index];
      byteCount = this.fileDirectory.StripByteCounts[index];
    }
    const slice = this.dataView.buffer.slice(offset, offset + byteCount);

    let promise;
    if (tiles === null) {
      // promise = this.getDecoder().decodeBlock(slice);
      promise = pool.decodeBlock(slice);
      // promise = this.pool.decodeBlock(offset, byteCount);
    } else if (!tiles[index]) {
      // tiles[index] = promise = this.getDecoder().decodeBlock(slice);
      tiles[index] = promise = pool.decodeBlock(slice);
      // tiles[index] = promise = this.pool.decodeBlock(offset, byteCount);
    }

    return promise.then(data => ({ x, y, sample, data }));
  }

  _readRaster(imageWindow, samples, valueArrays, interleave, pool) {
    const tileWidth = this.getTileWidth();
    const tileHeight = this.getTileHeight();

    const minXTile = Math.floor(imageWindow[0] / tileWidth);
    const maxXTile = Math.ceil(imageWindow[2] / tileWidth);
    const minYTile = Math.floor(imageWindow[1] / tileHeight);
    const maxYTile = Math.ceil(imageWindow[3] / tileHeight);

    const windowWidth = imageWindow[2] - imageWindow[0];
    // const windowHeight = imageWindow[3] - imageWindow[1];

    let bytesPerPixel = this.getBytesPerPixel();

    const srcSampleOffsets = [];
    const sampleReaders = [];
    for (let i = 0; i < samples.length; ++i) {
      if (this.planarConfiguration === 1) {
        srcSampleOffsets.push(sum(this.fileDirectory.BitsPerSample, 0, samples[i]) / 8);
      } else {
        srcSampleOffsets.push(0);
      }
      sampleReaders.push(this.getReaderForSample(samples[i]));
    }

    const promises = [];
    const littleEndian = this.littleEndian;

    for (let yTile = minYTile; yTile < maxYTile; ++yTile) {
      for (let xTile = minXTile; xTile < maxXTile; ++xTile) {
        for (let sampleIndex = 0; sampleIndex < samples.length; ++sampleIndex) {
          const si = sampleIndex;
          const sample = samples[si];
          if (this.planarConfiguration === 2) {
            bytesPerPixel = this.getSampleByteSize(sample);
          }
          const promise = this.getTileOrStrip(xTile, yTile, sample, pool);
          promises.push(promise);
          promise.then(tile => {
            const dataView = new DataView(tile.data);
            const firstLine = tile.y * tileHeight;
            const firstCol = tile.x * tileWidth;
            const lastLine = (tile.y + 1) * tileHeight;
            const lastCol = (tile.x + 1) * tileWidth;
            const reader = sampleReaders[si];

            const ymax = Math.min(tileHeight, tileHeight - (lastLine - imageWindow[3]));
            const xmax = Math.min(tileWidth, tileWidth - (lastCol - imageWindow[2]));

            for (let y = Math.max(0, imageWindow[1] - firstLine); y < ymax; ++y) {
              for (let x = Math.max(0, imageWindow[0] - firstCol); x < xmax; ++x) {
                const pixelOffset = ((y * tileWidth) + x) * bytesPerPixel;
                const value = reader.call(dataView, pixelOffset + srcSampleOffsets[si], littleEndian);
                let windowCoordinate;
                if (interleave) {
                  windowCoordinate =
                    (y + firstLine - imageWindow[1]) * windowWidth * samples.length +
                    (x + firstCol - imageWindow[0]) * samples.length +
                    si;
                  valueArrays[windowCoordinate] = value;
                }
                else {
                  windowCoordinate = (
                    y + firstLine - imageWindow[1]
                  ) * windowWidth + x + firstCol - imageWindow[0];
                  valueArrays[si][windowCoordinate] = value;
                }
              }
            }
          });
        }
      }
    }
    return Promise.all(promises).then(() => valueArrays);
  }

  /**
   * This callback is called upon successful reading of a GeoTIFF image. The
   * resulting arrays are passed as a single argument.
   * @callback GeoTIFFImage~readCallback
   * @param {(TypedArray|TypedArray[])} array the requested data as a either a
   *                                          single typed array or a list of
   *                                          typed arrays, depending on the
   *                                          'interleave' option.
   */

  /**
   * This callback is called upon encountering an error while reading of a
   * GeoTIFF image
   * @callback GeoTIFFImage~readErrorCallback
   * @param {Error} error the encountered error
   */

  /**
   * Reads raster data from the image. This function reads all selected samples
   * into separate arrays of the correct type for that sample. When provided,
   * only a subset of the raster is read for each sample.
   *
   * @param {Object} [options] optional parameters
   * @param {Array} [options.window=whole image] the subset to read data from.
   * @param {Array} [options.samples=all samples] the selection of samples to read from.
   * @param {Boolean} [options.interleave=false] whether the data shall be read
   *                                             in one single array or separate
   *                                             arrays.
   * @param {Number} [options.poolSize=null] The size of the Worker-Pool used to
   *                                         decode chunks. `null` means that the
   *                                         decoding is done in the main thread.
   * @returns {Promise.<(TypedArray|TypedArray[])>} the decoded arrays as a promise
   */
  readRasters({ window: wnd, samples = [], interleave, poolSize = null } = {}) {
    const imageWindow = wnd || [0, 0, this.getWidth(), this.getHeight()];
    const pool = new Pool(this.fileDirectory.Compression, poolSize);

    // check parameters
    if (imageWindow[0] < 0 ||
        imageWindow[1] < 0 ||
        imageWindow[2] > this.getWidth() ||
        imageWindow[3] > this.getHeight()) {
      return Promise.reject(new Error('Select window is out of image bounds.'));
    } else if (imageWindow[0] > imageWindow[2] || imageWindow[1] > imageWindow[3]) {
      return Promise.reject(new Error('Invalid subsets'));
    }

    const imageWindowWidth = imageWindow[2] - imageWindow[0];
    const imageWindowHeight = imageWindow[3] - imageWindow[1];
    const numPixels = imageWindowWidth * imageWindowHeight;

    if (!samples) {
      for (let i = 0; i < this.fileDirectory.SamplesPerPixel; ++i) {
        samples.push(i);
      }
    } else {
      for (let i = 0; i < samples.length; ++i) {
        if (samples[i] >= this.fileDirectory.SamplesPerPixel) {
          return Promise.reject(new RangeError(`Invalid sample index '${samples[i]}'.`));
        }
      }
    }
    let valueArrays;
    if (interleave) {
      const format = this.fileDirectory.SampleFormat ?
        Math.max.apply(null, this.fileDirectory.SampleFormat) : 1;
      const bitsPerSample = Math.max.apply(null, this.fileDirectory.BitsPerSample);
      valueArrays = arrayForType(format, bitsPerSample, numPixels * samples.length);
    } else {
      valueArrays = [];
      for (let i = 0; i < samples.length; ++i) {
        valueArrays.push(this.getArrayForSample(samples[i], numPixels));
      }
    }

    return this._readRaster(imageWindow, samples, valueArrays, interleave, pool)
      .then(result => {
        pool.destroy();
        return result;
      });
  }

  /**
   * Reads raster data from the image as RGB. The result is always an
   * interleaved typed array.
   * Colorspaces other than RGB will be transformed to RGB, color maps expanded.
   * When no other method is applicable, the first sample is used to produce a
   * greayscale image.
   * When provided, only a subset of the raster is read for each sample.
   *
   * @param {Object} [options] optional parameters
   * @param {Array} [options.window=whole image] the subset to read data from.
   * @param {Number} [options.poolSize=null] The size of the Worker-Pool used to
   *                                         decode chunks. `null` means that the
   *                                         decoding is done in the main thread.
   * @returns {Promise.<TypedArray|TypedArray[]>} the RGB array as a Promise
   */
  readRGB({ window, poolSize } = {}) {
    const imageWindow = window || [0, 0, this.getWidth(), this.getHeight()];

    // check parameters
    if (imageWindow[0] < 0 ||
        imageWindow[1] < 0 ||
        imageWindow[2] > this.getWidth() ||
        imageWindow[3] > this.getHeight()) {
      throw new Error('Select window is out of image bounds.');
    } else if (imageWindow[0] > imageWindow[2] || imageWindow[1] > imageWindow[3]) {
      throw new Error('Invalid subsets');
    }

    const width = imageWindow[2] - imageWindow[0];
    const height = imageWindow[3] - imageWindow[1];

    const pi = this.fileDirectory.PhotometricInterpretation;

    const bits = this.fileDirectory.BitsPerSample[0];
    const max = Math.pow(2, bits);

    if (pi === photometricInterpretations.RGB) {
      return this.readRasters({
        window,
        interleave: true,
        poolSize,
      });
    }

    let samples;
    switch (pi) {
      case photometricInterpretations.WhiteIsZero:
      case photometricInterpretations.BlackIsZero:
      case photometricInterpretations.Palette:
        samples = [0];
        break;
      case photometricInterpretations.CMYK:
        samples = [0, 1, 2, 3];
        break;
      case photometricInterpretations.YCbCr:
      case photometricInterpretations.CIELab:
        samples = [0, 1, 2];
        break;
      default:
        throw new Error('Invalid or unsupported photometric interpretation.');
    }

    const subOptions = {
      window: imageWindow,
      interleave: true,
      samples,
      poolSize,
    };
    const fileDirectory = this.fileDirectory;
    return this.readRasters(subOptions)
      .then(raster => {
        switch (pi) {
          case photometricInterpretations.WhiteIsZero:
            return fromWhiteIsZero(raster, max, width, height);
          case photometricInterpretations.BlackIsZero:
            return fromBlackIsZero(raster, max, width, height);
          case photometricInterpretations.Palette:
            return fromPalette(raster, fileDirectory.ColorMap, width, height);
          case photometricInterpretations.CMYK:
            return fromCMYK(raster, width, height);
          case photometricInterpretations.YCbCr:
            return fromYCbCr(raster, width, height);
          case photometricInterpretations.CIELab:
            return fromCIELab(raster, width, height);
          default:
            throw new Error('Unsupported photometric interpretation.');
        }
      });
  }

  /**
   * Returns an array of tiepoints.
   * @returns {Object[]}
   */
  getTiePoints() {
    if (!this.fileDirectory.ModelTiepoint) {
      return [];
    }

    const tiePoints = [];
    for (let i = 0; i < this.fileDirectory.ModelTiepoint.length; i += 6) {
      tiePoints.push({
        i: this.fileDirectory.ModelTiepoint[i],
        j: this.fileDirectory.ModelTiepoint[i + 1],
        k: this.fileDirectory.ModelTiepoint[i + 2],
        x: this.fileDirectory.ModelTiepoint[i + 3],
        y: this.fileDirectory.ModelTiepoint[i + 4],
        z: this.fileDirectory.ModelTiepoint[i + 5],
      });
    }
    return tiePoints;
  }

  /**
   * Returns the parsed GDAL metadata items.
   * @returns {Object}
   */
  getGDALMetadata() {
    const metadata = {};
    if (!this.fileDirectory.GDAL_METADATA) {
      return null;
    }
    const string = this.fileDirectory.GDAL_METADATA;
    const xmlDom = parseXml(string.substring(0, string.length - 1));
    const result = xmlDom.evaluate(
      'GDALMetadata/Item', xmlDom, null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
    );
    for (let i = 0; i < result.snapshotLength; ++i) {
      const node = result.snapshotItem(i);
      metadata[node.getAttribute('name')] = node.textContent;
    }
    return metadata;
  }
}

export default GeoTIFFImage;
