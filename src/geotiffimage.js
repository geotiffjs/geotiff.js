
var globals = require("./globals.js"),
  fieldTags = globals.fieldTags,
  fieldTagNames = globals.fieldTagNames,
  arrayFields = globals.arrayFields,
  fieldTypes = globals.fieldTypes,
  fieldTypeNames = globals.fieldTypeNames;

var sum = function(array, start, end) {
  var s = 0;
  for (var i = start; i < end; ++i) {
    s += array[i];
  }
  return s;
};

var GeoTIFFImage = function(fileDirectory, geoKeys, dataView, littleEndian) {
  this.fileDirectory = fileDirectory;
  this.geoKeys = geoKeys;
  this.dataView = dataView;
  this.littleEndian = littleEndian;
  this.tiles = {};
  this.isTiled = (fileDirectory.StripOffsets) ? false : true;
  var planarConfiguration = fileDirectory.PlanarConfiguration;
  this.planarConfiguration = (typeof planarConfiguration === "undefined") ? 1 : planarConfiguration;
  if (this.planarConfiguration !== 1 && this.planarConfiguration !== 2) {
    throw new Error("Invalid planar configuration.");
  }
};

GeoTIFFImage.prototype = {
  getWidth: function() {
    return this.fileDirectory.ImageWidth;
  },
  getHeight: function() {
    return this.fileDirectory.ImageLength;
  },
  getSamplesPerPixel: function() {
    return this.fileDirectory.SamplesPerPixel;
  },
  getTileWidth: function() {
    return this.isTiled ? this.fileDirectory.TileWidth : this.getWidth();
  },
  getTileHeight: function() {
    return this.isTiled ? this.fileDirectory.TileLength : this.fileDirectory.RowsPerStrip;
  },

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

  decodeBlock: function(offset, byteCount, outSize) {
    var slice = this.dataView.buffer.slice(offset, offset + byteCount);
    switch (this.fileDirectory.Compression) {
      case 1:  // no compression
        return slice;
      case 5: // LZW
        throw new Error("LZW compression not supported.");
      case 6: // JPEG
        throw new Error("JPEG compression not supported.");
      case 8: // Deflate
        throw new Error("Deflate compression not supported.");
      //case 32946: // deflate ??
      //  throw new Error("Deflate compression not supported.");
      case 32773: // packbits
        throw new Error("PackBits compression not supported.");
      default:
        throw new Error("Unknown compresseion method identifier: " + this.fileDirectory.Compression);
    }
  },

  getReaderForSample: function(sampleIndex) {
    var format = this.fileDirectory.SampleFormat[sampleIndex];
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
    var format = this.fileDirectory.SampleFormat[sampleIndex];
    var bitsPerSample = this.fileDirectory.BitsPerSample[sampleIndex];
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
  },

  // Get the Tile or Strip by coordinates/index
  getTileOrStrip: function(x, y, plane) {
    var numTilesPerRow = Math.ceil(this.getWidth() / this.getTileWidth());
    var numTilesPerCol = Math.ceil(this.getHeight() / this.getTileHeight());
    var index;
    if (this.planarConfiguration === 1) {
      index = y * numTilesPerRow + x;
    }
    else if (this.planarConfiguration === 2) {
      index = plane * numTilesPerRow * numTilesPerCol + y * numTilesPerRow + x;
    }
    
    if (index in this.tiles && false) {
        return this.tiles[index];
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
        return this.tiles[index] = this.decodeBlock(offset, byteCount);
      }
  },

  _readRaster: function(imageWindow, samples, valueArrays) {
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

    var srcSampleOffsets = [];
    var sampleReaders = []; 
    for (var i = 0; i < samples.length; ++i) {
      if (this.planarConfiguration === 1) {
        srcSampleOffsets.push(sum(this.fileDirectory.BitsPerSample, 0, samples[i]) / 8);
      }
      else {
        srcSampleOffsets.push(0);
      }
      sampleReaders.push(this.getReaderForSample(samples[i]));
    }

    for (var yTile = minYTile; yTile <= maxYTile; ++yTile) {
      for (var xTile = minXTile; xTile <= maxXTile; ++xTile) {
        
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

          for (var y = Math.max(0, imageWindow[1] - firstLine); y < Math.min(tileHeight, tileHeight - (lastLine - imageWindow[3])); ++y) {
            for (var x = Math.max(0, imageWindow[0] - firstCol); x < Math.min(tileWidth, tileWidth - (lastCol - imageWindow[2])); ++x) {
              var pixelOffset = (y * tileWidth + x) * bytesPerPixel;
              var windowCoordinate = (
                y + firstLine - imageWindow[1]
              ) * windowWidth + x + firstCol - imageWindow[0];
              valueArrays[sampleIndex][windowCoordinate] = sampleReaders[sampleIndex].call(tile, pixelOffset + srcSampleOffsets[sampleIndex], this.littleEndian);
            }
          }
        }
      }
    }
  },

  readRasters: function(imageWindow, samples) {
    imageWindow = imageWindow || [0, 0, this.getWidth(), this.getHeight()];

    if (imageWindow[0] < 0 || imageWindow[1] < 0 || imageWindow[2] > this.getWidth() || imageWindow[3] > this.getHeight()) {
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
    var valueArrays = [];
    for (i = 0; i < samples.length; ++i) {
      valueArrays.push(this.getArrayForSample(samples[i], numPixels));
    }

    this._readRaster(imageWindow, samples, valueArrays);
    return valueArrays;
  },
};


module.exports = GeoTIFFImage;