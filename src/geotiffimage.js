"use strict";

var globals = require("./globals.js");
var RGB = require("./rgb.js");
var RawDecoder = require("./compression/raw.js");
var LZWDecoder = require("./compression/lzw.js");
var DeflateDecoder = require("./compression/deflate.js");
var PackbitsDecoder = require("./compression/packbits.js");

var map = require("lodash").map;

var stringify = function(obj) {
  if (obj.length) {
    return JSON.stringify(map(obj));
  } else {
    return JSON.stringify(obj);
  }
};

var sum = function(array, start, end) {
  var s = 0;
  for (var i = start; i < end; ++i) {
    s += array[i];
  }
  return s;
};

var arrayForType = function(format, bitsPerSample, size) {
  switch (format) {
    case 1: // unsigned integer data
      switch (bitsPerSample) {
        case 8:
          return new Uint8Array(size);
        case 16:
          return new Uint16Array(size);
        case 32:
          return new Uint32Array(size);
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
      }
      break;
    case 3: // floating point data
      switch (bitsPerSample) {
        case 32:
          return new Float32Array(size);
        case 64:
          return new Float64Array(size);
      }
      break;
  }
  throw Error("Unsupported data format/bitsPerSample");
};

/**
 * GeoTIFF sub-file image.
 * @constructor
 * @param {Object} fileDirectory The parsed file directory
 * @param {Object} geoKeys The parsed geo-keys
 * @param {DataView} dataView The DataView for the underlying file.
 * @param {Boolean} littleEndian Whether the file is encoded in little or big endian
 * @param {Boolean} cache Whether or not decoded tiles shall be cached
 */
function GeoTIFFImage(fileDirectory, geoKeys, dataView, littleEndian, cache) {
  this.fileDirectory = fileDirectory;
  this.geoKeys = geoKeys;
  this.dataView = dataView;
  this.littleEndian = littleEndian;
  this.tiles = cache ? {} : null;
  this.isTiled = (fileDirectory.StripOffsets) ? false : true;
  var planarConfiguration = fileDirectory.PlanarConfiguration;
  this.planarConfiguration = (typeof planarConfiguration === "undefined") ? 1 : planarConfiguration;
  if (this.planarConfiguration !== 1 && this.planarConfiguration !== 2) {
    throw new Error("Invalid planar configuration.");
  }

  switch (this.fileDirectory.Compression) {
    case undefined:
    case 1: // no compression
      this.decoder = new RawDecoder();
      break;
    case 5: // LZW
      this.decoder = new LZWDecoder();
      break;
    case 6: // JPEG
      throw new Error("JPEG compression not supported.");
    case 8: // Deflate
      this.decoder = new DeflateDecoder();
      break;
    //case 32946: // deflate ??
    //  throw new Error("Deflate compression not supported.");
    case 32773: // packbits
      this.decoder = new PackbitsDecoder();
      break;
    default:
      throw new Error("Unknown compresseion method identifier: " + this.fileDirectory.Compression);
  }
}

GeoTIFFImage.prototype = {
  /**
   * Returns the associated parsed file directory.
   * @returns {Object} the parsed file directory
   */
  getFileDirectory: function() {
    return this.fileDirectory;
  },
   /**
   * Returns the associated parsed geo keys.
   * @returns {Object} the parsed geo keys
   */
  getGeoKeys: function() {
    return this.geoKeys;
  },
  /**
   * Returns the width of the image.
   * @returns {Number} the width of the image
   */
  getWidth: function() {
    return this.fileDirectory.ImageWidth;
  },
  /**
   * Returns the height of the image.
   * @returns {Number} the height of the image
   */
  getHeight: function() {
    return this.fileDirectory.ImageLength;
  },
  /**
   * Returns the number of samples per pixel.
   * @returns {Number} the number of samples per pixel
   */
  getSamplesPerPixel: function() {
    return this.fileDirectory.SamplesPerPixel;
  },
  /**
   * Returns the width of each tile.
   * @returns {Number} the width of each tile
   */
  getTileWidth: function() {
    return this.isTiled ? this.fileDirectory.TileWidth : this.getWidth();
  },
  /**
   * Returns the height of each tile.
   * @returns {Number} the height of each tile
   */
  getTileHeight: function() {
    return this.isTiled ? this.fileDirectory.TileLength : this.fileDirectory.RowsPerStrip;
  },

  /**
   * Calculates the number of bytes for each pixel across all samples. Only full
   * bytes are supported, an exception is thrown when this is not the case.
   * @returns {Number} the bytes per pixel
   */
  getBytesPerPixel: function() {
    var bitsPerSample = 0;
    for (var i = 0; i < this.fileDirectory.BitsPerSample.length; ++i) {
      var bits = this.fileDirectory.BitsPerSample[i];
      if ((bits % 8) !== 0) {
        throw new Error("Sample bit-width of " + bits + " is not supported.");
      }
      else if (bits !== this.fileDirectory.BitsPerSample[0]) {
        throw new Error("Differing size of samples in a pixel are not supported.");
      }
      bitsPerSample += bits;
    }
    return bitsPerSample / 8;
  },

  getSampleByteSize: function(i) {
    if (i >= this.fileDirectory.BitsPerSample.length) {
      throw new RangeError("Sample index " + i + " is out of range.");
    }
    var bits = this.fileDirectory.BitsPerSample[i];
    if ((bits % 8) !== 0) {
      throw new Error("Sample bit-width of " + bits + " is not supported.");
    }
    return (bits / 8);
  },

  getReaderForSample: function(sampleIndex) {
    var format = this.fileDirectory.SampleFormat ? this.fileDirectory.SampleFormat[sampleIndex] : 1;
    var bitsPerSample = this.fileDirectory.BitsPerSample[sampleIndex];
    switch (format) {
      case 1: // unsigned integer data
        switch (bitsPerSample) {
          case 8:
            return DataView.prototype.getUint8;
          case 16:
            return DataView.prototype.getUint16;
          case 32:
            return DataView.prototype.getUint32;
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
        }
        break;
      case 3:
        switch (bitsPerSample) {
          case 32:
            return DataView.prototype.getFloat32;
          case 64:
            return DataView.prototype.getFloat64;
        }
        break;
    }
  },

  getArrayForSample: function(sampleIndex, size) {
    var format = this.fileDirectory.SampleFormat ? this.fileDirectory.SampleFormat[sampleIndex] : 1;
    var bitsPerSample = this.fileDirectory.BitsPerSample[sampleIndex];
    return arrayForType(format, bitsPerSample, size);
  },

  getDecoder: function() {
    return this.decoder;
  },

  /**
   * Returns the decoded strip or tile.
   * @param {Number} x the strip or tile x-offset
   * @param {Number} y the tile y-offset (0 for stripped images)
   * @param {Number} plane the planar configuration (1: "chunky", 2: "separate samples")
   * @returns {(Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array)}
   */
  getTileOrStrip: function(x, y, sample, callback) {
    var numTilesPerRow = Math.ceil(this.getWidth() / this.getTileWidth());
    var numTilesPerCol = Math.ceil(this.getHeight() / this.getTileHeight());
    var index;
    var tiles = this.tiles;
    if (this.planarConfiguration === 1) {
      index = y * numTilesPerRow + x;
    }
    else if (this.planarConfiguration === 2) {
      index = sample * numTilesPerRow * numTilesPerCol + y * numTilesPerRow + x;
    }

    if (tiles !== null && index in tiles) {
      if (callback) {
        return callback(null, {x: x, y: y, sample: sample, data: tiles[index]});
      }
      return tiles[index];
    }
    else {
      var offset, byteCount;
      if (this.isTiled) {
        offset = this.fileDirectory.TileOffsets[index];
        byteCount = this.fileDirectory.TileByteCounts[index];
      }
      else {
        offset = this.fileDirectory.StripOffsets[index];
        byteCount = this.fileDirectory.StripByteCounts[index];
      }
      var slice = this.dataView.buffer.slice(offset, offset + byteCount);
      if (callback) {
        return this.getDecoder().decodeBlockAsync(slice, function(error, data) {
          if (!error && tiles !== null) {
            tiles[index] = data;
          }
          callback(error, {x: x, y: y, sample: sample, data: data});
        });
      }
      var block = this.getDecoder().decodeBlock(slice);
      if (tiles !== null) {
        tiles[index] = block;
      }
      return block;
    }
  },

  _readRasterAsync: function(imageWindow, samples, valueArrays, interleave, callback, callbackError) {
    var tileWidth = this.getTileWidth();
    var tileHeight = this.getTileHeight();

    var minXTile = Math.floor(imageWindow[0] / tileWidth);
    var maxXTile = Math.ceil(imageWindow[2] / tileWidth);
    var minYTile = Math.floor(imageWindow[1] / tileHeight);
    var maxYTile = Math.ceil(imageWindow[3] / tileHeight);

    var numTilesPerRow = Math.ceil(this.getWidth() / tileWidth);

    var windowWidth = imageWindow[2] - imageWindow[0];
    var windowHeight = imageWindow[3] - imageWindow[1];

    var bytesPerPixel = this.getBytesPerPixel();
    var imageWidth = this.getWidth();

    var predictor = this.fileDirectory.Predictor || 1;

    var srcSampleOffsets = [];
    var sampleReaders = [];
    for (var i = 0; i < samples.length; ++i) {
      if (this.planarConfiguration === 1) {
        srcSampleOffsets.push(sum(this.fileDirectory.BitsPerSample, 0, samples[i]) / 8);
      }
      else {
        srcSampleOffsets.push(0);
      }
      sampleReaders.push(this.getReaderForSample(samples[i]));
    }

    var allStacked = false;
    var unfinishedTiles = 0;
    var littleEndian = this.littleEndian;
    var globalError = null;

    function checkFinished() {
      if (allStacked && unfinishedTiles === 0) {
        if (globalError) {
          callbackError(globalError);
        }
        else {
          callback(valueArrays);
        }
      }
    }

    function onTileGot(error, tile) {
      if (!error) {
        var dataView = new DataView(tile.data);

        var firstLine = tile.y * tileHeight;
        var firstCol = tile.x * tileWidth;
        var lastLine = (tile.y + 1) * tileHeight;
        var lastCol = (tile.x + 1) * tileWidth;
        var sampleIndex = tile.sample;

        for (var y = Math.max(0, imageWindow[1] - firstLine); y < Math.min(tileHeight, tileHeight - (lastLine - imageWindow[3])); ++y) {
          for (var x = Math.max(0, imageWindow[0] - firstCol); x < Math.min(tileWidth, tileWidth - (lastCol - imageWindow[2])); ++x) {
            var pixelOffset = (y * tileWidth + x) * bytesPerPixel;
            var value = sampleReaders[sampleIndex].call(dataView, pixelOffset + srcSampleOffsets[sampleIndex], littleEndian);
            var windowCoordinate;
            if (interleave) {
              if (predictor !== 1 && x > 0) {
                windowCoordinate =
                  (y + firstLine - imageWindow[1]) * windowWidth * samples.length +
                  (x + firstCol - imageWindow[0] - 1) * samples.length +
                  sampleIndex;
                value += valueArrays[windowCoordinate];
              }

              windowCoordinate =
                (y + firstLine - imageWindow[1]) * windowWidth * samples.length +
                (x + firstCol - imageWindow[0]) * samples.length +
                sampleIndex;
              valueArrays[windowCoordinate] = value;
            }
            else {
              if (predictor !== 1 && x > 0) {
                windowCoordinate = (
                  y + firstLine - imageWindow[1]
                ) * windowWidth + x - 1 + firstCol - imageWindow[0];
                value += valueArrays[sampleIndex][windowCoordinate];
              }

              windowCoordinate = (
                y + firstLine - imageWindow[1]
              ) * windowWidth + x + firstCol - imageWindow[0];
              valueArrays[sampleIndex][windowCoordinate] = value;
            }
          }
        }
      }
      else {
        globalError = error;
      }

      // check end condition and call callbacks
      unfinishedTiles -= 1;
      checkFinished();
    }

    for (var yTile = minYTile; yTile <= maxYTile; ++yTile) {
      for (var xTile = minXTile; xTile <= maxXTile; ++xTile) {
        for (var sampleIndex = 0; sampleIndex < samples.length; ++sampleIndex) {
          var sample = samples[sampleIndex];
          if (this.planarConfiguration === 2) {
            bytesPerPixel = this.getSampleByteSize(sample);
          }
          var _sampleIndex = sampleIndex;
          unfinishedTiles += 1;
          this.getTileOrStrip(xTile, yTile, sample, onTileGot);
        }
      }
    }
    allStacked = true;
    checkFinished();
  },

  _readRaster: function(imageWindow, samples, valueArrays, interleave, callback, callbackError) {
    try {
      var tileWidth = this.getTileWidth();
      var tileHeight = this.getTileHeight();

      var minXTile = Math.floor(imageWindow[0] / tileWidth);
      var maxXTile = Math.ceil(imageWindow[2] / tileWidth);
      var minYTile = Math.floor(imageWindow[1] / tileHeight);
      var maxYTile = Math.ceil(imageWindow[3] / tileHeight);

      var numTilesPerRow = Math.ceil(this.getWidth() / tileWidth);

      var windowWidth = imageWindow[2] - imageWindow[0];
      var windowHeight = imageWindow[3] - imageWindow[1];

      var bytesPerPixel = this.getBytesPerPixel();
      var imageWidth = this.getWidth();

      var predictor = this.fileDirectory.Predictor || 1;
      //console.log("predictor:", predictor);

      var srcSampleOffsets = [];
      var sampleReaders = [];
      for (var i = 0; i < samples.length; ++i) {
        if (this.planarConfiguration === 1) {
          srcSampleOffsets.push(sum(this.fileDirectory.BitsPerSample, 0, samples[i]) / 8);
        }
        else {
          srcSampleOffsets.push(0);
        }
        sampleReaders.push(this.getReaderForSample(samples[i]));
      }

      for (var yTile = minYTile; yTile < maxYTile; ++yTile) {
        for (var xTile = minXTile; xTile < maxXTile; ++xTile) {
          var firstLine = yTile * tileHeight;
          var firstCol = xTile * tileWidth;
          var lastLine = (yTile + 1) * tileHeight;
          var lastCol = (xTile + 1) * tileWidth;

          for (var sampleIndex = 0; sampleIndex < samples.length; ++sampleIndex) {
            var sample = samples[sampleIndex];
            if (this.planarConfiguration === 2) {
              bytesPerPixel = this.getSampleByteSize(sample);
            }
            var tile = new DataView(this.getTileOrStrip(xTile, yTile, sample));
            //console.log('tile:', stringify(new Uint8Array(tile)));

            var reader = sampleReaders[sampleIndex];
            var ymax = Math.min(tileHeight, tileHeight - (lastLine - imageWindow[3]));
            var xmax = Math.min(tileWidth, tileWidth - (lastCol - imageWindow[2]));
            //console.log("xmax:", xmax);
            var totalbytes = (ymax * tileWidth + xmax) * bytesPerPixel;
            var tileLength = (new Uint8Array(tile.buffer).length);
            if (2*tileLength !== totalbytes && this._debugMessages) {
              console.warn('dimension mismatch', tileLength, totalbytes);
            }
            for (var y = Math.max(0, imageWindow[1] - firstLine); y < ymax; ++y) {
              for (var x = Math.max(0, imageWindow[0] - firstCol); x < xmax; ++x) {
                //console.log(" ");
                //console.log(" ");
                //console.log("x:", x);
                var pixelOffset = (y * tileWidth + x) * bytesPerPixel;
                //console.log("pixelOffset:", pixelOffset);
                //console.log("tileLength", tileLength);
                var value = 0;
                if (pixelOffset < tileLength) {
                  value = reader.call(tile, pixelOffset + srcSampleOffsets[sampleIndex], this.littleEndian);
                  //console.log("reader called value:", value);
                }
                //console.log("value:", value);
                var windowCoordinate;
                if (interleave) {
                  if (predictor !== 1 && x > 0) {
                    windowCoordinate =
                      (y + firstLine - imageWindow[1]) * windowWidth * samples.length +
                      (x + firstCol - imageWindow[0] - 1) * samples.length +
                      sampleIndex;
                    value += valueArrays[windowCoordinate];
                  }

                  windowCoordinate =
                    (y + firstLine - imageWindow[1]) * windowWidth * samples.length +
                    (x + firstCol - imageWindow[0]) * samples.length +
                    sampleIndex;
                  valueArrays[windowCoordinate] = value;
                }
                else {
                  if (predictor !== 1 && x > 0) {
                    windowCoordinate = (
                      y + firstLine - imageWindow[1]
                    ) * windowWidth + x - 1 + firstCol - imageWindow[0];
                    value += valueArrays[sampleIndex][windowCoordinate];
                  }

                  windowCoordinate = (
                    y + firstLine - imageWindow[1]
                  ) * windowWidth + x + firstCol - imageWindow[0];
                  valueArrays[sampleIndex][windowCoordinate] = value;
                }
                //console.log("x ending:", x);
              }
            }
          }
        }
      }
      callback(valueArrays);
      return valueArrays;
    }
    catch (error) {
      return callbackError(error);
    }
  },

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
   * @param {GeoTIFFImage~readCallback} [callback] the success callback. this
   *                                               parameter is mandatory for
   *                                               asynchronous decoders (some
   *                                               compression mechanisms).
   * @param {GeoTIFFImage~readErrorCallback} [callbackError] the error callback
   * @returns {(TypedArray|TypedArray[]|null)} in synchonous cases, the decoded
   *                                           array(s) is/are returned. In
   *                                           asynchronous cases, nothing is
   *                                           returned.
   */
  readRasters: function(/* arguments are read via the 'arguments' object */) {
    // parse the arguments
    var options, callback, callbackError;
    switch (arguments.length) {
      case 0:
        break;
      case 1:
        if (typeof arguments[0] === "function") {
          callback = arguments[0];
        }
        else {
          options = arguments[0];
        }
        break;
      case 2:
        if (typeof arguments[0] === "function") {
          callback = arguments[0];
          callbackError = arguments[1];
        }
        else {
          options = arguments[0];
          callback = arguments[1];
        }
        break;
      case 3:
        options = arguments[0];
        callback = arguments[1];
        callbackError = arguments[2];
        break;
      default:
        throw new Error("Invalid number of arguments passed.");
    }

    // set up default arguments
    options = options || {};
    callbackError = callbackError || function(error) { console.error(error); };

    var imageWindow = options.window || [0, 0, this.getWidth(), this.getHeight()],
        samples = options.samples,
        interleave = options.interleave;

    // check parameters
    if (imageWindow[0] < 0 ||
        imageWindow[1] < 0 ||
        imageWindow[2] > this.getWidth() ||
        imageWindow[3] > this.getHeight()) {
      throw new Error("Select window is out of image bounds.");
    }
    else if (imageWindow[0] > imageWindow[2] || imageWindow[1] > imageWindow[3]) {
      throw new Error("Invalid subsets");
    }

    var imageWindowWidth = imageWindow[2] - imageWindow[0];
    var imageWindowHeight = imageWindow[3] - imageWindow[1];
    var numPixels = imageWindowWidth * imageWindowHeight;
    var i;

    if (!samples) {
      samples = [];
      for (i=0; i < this.fileDirectory.SamplesPerPixel; ++i) {
        samples.push(i);
      }
    }
    else {
      for (i = 0; i < samples.length; ++i) {
        if (samples[i] >= this.fileDirectory.SamplesPerPixel) {
          throw new RangeError("Invalid sample index '" + samples[i] + "'.");
        }
      }
    }
    var valueArrays;
    if (interleave) {
      var format = this.fileDirectory.SampleFormat ? Math.max.apply(null, this.fileDirectory.SampleFormat) : 1,
          bitsPerSample = Math.max.apply(null, this.fileDirectory.BitsPerSample);
      valueArrays = arrayForType(format, bitsPerSample, numPixels * samples.length);
    }
    else {
      valueArrays = [];
      for (i = 0; i < samples.length; ++i) {
        valueArrays.push(this.getArrayForSample(samples[i], numPixels));
      }
    }

    // start reading data, sync or async
    var decoder = this.getDecoder();
    if (decoder.isAsync()) {
      if (!callback) {
        throw new Error("No callback specified for asynchronous raster reading.");
      }
      return this._readRasterAsync(
        imageWindow, samples, valueArrays, interleave, callback, callbackError
      );
    }
    else {
      callback = callback || function() {};
      return this._readRaster(
        imageWindow, samples, valueArrays, interleave, callback, callbackError
      );
    }
  },

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
   * @param {GeoTIFFImage~readCallback} callback the success callback. this
   *                                             parameter is mandatory.
   * @param {GeoTIFFImage~readErrorCallback} [callbackError] the error callback
   */
  readRGB: function() {
    // parse the arguments
    var options = null, callback = null, callbackError = null;
    switch (arguments.length) {
      case 0:
        break;
      case 1:
        if (typeof arguments[0] === "function") {
          callback = arguments[0];
        }
        else {
          options = arguments[0];
        }
        break;
      case 2:
        if (typeof arguments[0] === "function") {
          callback = arguments[0];
          callbackError = arguments[1];
        }
        else {
          options = arguments[0];
          callback = arguments[1];
        }
        break;
      case 3:
        options = arguments[0];
        callback = arguments[1];
        callbackError = arguments[2];
        break;
      default:
        throw new Error("Invalid number of arguments passed.");
    }

    // set up default arguments
    options = options || {};
    callbackError = callbackError || function(error) { console.error(error); };

    var imageWindow = options.window || [0, 0, this.getWidth(), this.getHeight()];

    // check parameters
    if (imageWindow[0] < 0 ||
        imageWindow[1] < 0 ||
        imageWindow[2] > this.getWidth() ||
        imageWindow[3] > this.getHeight()) {
      throw new Error("Select window is out of image bounds.");
    }
    else if (imageWindow[0] > imageWindow[2] || imageWindow[1] > imageWindow[3]) {
      throw new Error("Invalid subsets");
    }

    var width = imageWindow[2] - imageWindow[0];
    var height = imageWindow[3] - imageWindow[1];

    var pi = this.fileDirectory.PhotometricInterpretation;

    var bits = this.fileDirectory.BitsPerSample[0];
    var max = Math.pow(2, bits);

    if (pi === globals.photometricInterpretations.RGB) {
      return this.readRasters({
        window: options.window,
        interleave: true
      }, callback, callbackError);
    }

    var samples;
    switch(pi) {
      case globals.photometricInterpretations.WhiteIsZero:
      case globals.photometricInterpretations.BlackIsZero:
      case globals.photometricInterpretations.Palette:
        samples = [0];
        break;
      case globals.photometricInterpretations.CMYK:
        samples = [0, 1, 2, 3];
        break;
      case globals.photometricInterpretations.YCbCr:
      case globals.photometricInterpretations.CIELab:
        samples = [0, 1, 2];
        break;
      default:
        throw new Error("Invalid or unsupported photometric interpretation.");
    }

    var subOptions = {
      window: options.window,
      interleave: true,
      samples: samples
    };
    var fileDirectory = this.fileDirectory;
    return this.readRasters(subOptions, function(raster) {
      switch(pi) {
        case globals.photometricInterpretations.WhiteIsZero:
          return callback(RGB.fromWhiteIsZero(raster, max, width, height));
        case globals.photometricInterpretations.BlackIsZero:
          return callback(RGB.fromBlackIsZero(raster, max, width, height));
        case globals.photometricInterpretations.Palette:
          return callback(RGB.fromPalette(raster, fileDirectory.ColorMap, width, height));
        case globals.photometricInterpretations.CMYK:
          return callback(RGB.fromCMYK(raster, width, height));
        case globals.photometricInterpretations.YCbCr:
          return callback(RGB.fromYCbCr(raster, width, height));
        case globals.photometricInterpretations.CIELab:
          return callback(RGB.fromCIELab(raster, width, height));
      }
    }, callbackError);
  },

  /**
   * Returns an array of tiepoints.
   * @returns {Object[]}
   */
  getTiePoints: function() {
    if (!this.fileDirectory.ModelTiepoint) {
      return [];
    }

    var tiePoints = [];
    for (var i = 0; i < this.fileDirectory.ModelTiepoint.length; i += 6) {
      tiePoints.push({
        i: this.fileDirectory.ModelTiepoint[i],
        j: this.fileDirectory.ModelTiepoint[i+1],
        k: this.fileDirectory.ModelTiepoint[i+2],
        x: this.fileDirectory.ModelTiepoint[i+3],
        y: this.fileDirectory.ModelTiepoint[i+4],
        z: this.fileDirectory.ModelTiepoint[i+5]
      });
    }
    return tiePoints;
  },

  /**
   * Returns the parsed GDAL metadata items.
   * @returns {Object}
   */
  getGDALMetadata: function() {
    var metadata = {};
    if (!this.fileDirectory.GDAL_METADATA) {
      return null;
    }
    var string = this.fileDirectory.GDAL_METADATA;
    var xmlDom = globals.parseXml(string.substring(0, string.length-1));
    var result = xmlDom.evaluate(
      "GDALMetadata/Item", xmlDom, null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
    );
    for (var i=0; i < result.snapshotLength; ++i) {
      var node = result.snapshotItem(i);
      metadata[node.getAttribute("name")] = node.textContent;
    }
    return metadata;
  },

  /**
   * Returns the image origin as a XYZ-vector. When the image has no affine
   * transformation, then an exception is thrown.
   * @returns {Array} The origin as a vector
   */
  getOrigin: function() {
    var tiePoints = this.fileDirectory.ModelTiepoint;
    if (!tiePoints || tiePoints.length !== 6) {
      throw new Error("The image does not have an affine transformation.");
    }

    return [tiePoints[3], tiePoints[4], tiePoints[5]];
  },

  /**
   * Returns the image resolution as a XYZ-vector. When the image has no affine
   * transformation, then an exception is thrown.
   * @returns {Array} The resolution as a vector
   */
  getResolution: function() {
    if (!this.fileDirectory.ModelPixelScale) {
      throw new Error("The image does not have an affine transformation.");
    }

    return [
      this.fileDirectory.ModelPixelScale[0],
      this.fileDirectory.ModelPixelScale[1],
      this.fileDirectory.ModelPixelScale[2]
    ];
  },

  /**
   * Returns whether or not the pixels of the image depict an area (or point).
   * @returns {Boolean} Whether the pixels are a point
   */
  pixelIsArea: function() {
    return this.geoKeys.GTRasterTypeGeoKey === 1;
  },

  /**
   * Returns the image bounding box as an array of 4 values: min-x, min-y,
   * max-x and max-y. When the image has no affine transformation, then an
   * exception is thrown.
   * @returns {Array} The bounding box
   */
  getBoundingBox: function() {
    var origin = this.getOrigin();
    var resolution = this.getResolution();

    var x1 = origin[0];
    var y1 = origin[1];

    var x2 = x1 + resolution[0] * this.getWidth();
    var y2 = y1 + resolution[1] * this.getHeight();

    return [
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.max(x1, x2),
      Math.max(y1, y2),
    ];
  }
};

module.exports = GeoTIFFImage;
