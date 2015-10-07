var GeoTIFF = (function() {

  var fieldTagNames = {
    // TIFF Baseline
    0x013B: 'Artist',
    0x0102: 'BitsPerSample',
    0x0109: 'CellLength',
    0x0108: 'CellWidth',
    0x0140: 'ColorMap',
    0x0103: 'Compression',
    0x8298: 'Copyright',
    0x0132: 'DateTime',
    0x0152: 'ExtraSamples',
    0x010A: 'FillOrder',
    0x0121: 'FreeByteCounts',
    0x0120: 'FreeOffsets',
    0x0123: 'GrayResponseCurve',
    0x0122: 'GrayResponseUnit',
    0x013C: 'HostComputer',
    0x010E: 'ImageDescription',
    0x0101: 'ImageLength',
    0x0100: 'ImageWidth',
    0x010F: 'Make',
    0x0119: 'MaxSampleValue',
    0x0118: 'MinSampleValue',
    0x0110: 'Model',
    0x00FE: 'NewSubfileType',
    0x0112: 'Orientation',
    0x0106: 'PhotometricInterpretation',
    0x011C: 'PlanarConfiguration',
    0x0128: 'ResolutionUnit',
    0x0116: 'RowsPerStrip',
    0x0115: 'SamplesPerPixel',
    0x0131: 'Software',
    0x0117: 'StripByteCounts',
    0x0111: 'StripOffsets',
    0x00FF: 'SubfileType',
    0x0107: 'Threshholding',
    0x011A: 'XResolution',
    0x011B: 'YResolution',

    // TIFF Extended
    0x0146: 'BadFaxLines',
    0x0147: 'CleanFaxData',
    0x0157: 'ClipPath',
    0x0148: 'ConsecutiveBadFaxLines',
    0x01B1: 'Decode',
    0x01B2: 'DefaultImageColor',
    0x010D: 'DocumentName',
    0x0150: 'DotRange',
    0x0141: 'HalftoneHints',
    0x015A: 'Indexed',
    0x015B: 'JPEGTables',
    0x011D: 'PageName',
    0x0129: 'PageNumber',
    0x013D: 'Predictor',
    0x013F: 'PrimaryChromaticities',
    0x0214: 'ReferenceBlackWhite',
    0x0153: 'SampleFormat',
    0x0154: 'SMinSampleValue',
    0x0155: 'SMaxSampleValue',
    0x022F: 'StripRowCounts',
    0x014A: 'SubIFDs',
    0x0124: 'T4Options',
    0x0125: 'T6Options',
    0x0145: 'TileByteCounts',
    0x0143: 'TileLength',
    0x0144: 'TileOffsets',
    0x0142: 'TileWidth',
    0x012D: 'TransferFunction',
    0x013E: 'WhitePoint',
    0x0158: 'XClipPathUnits',
    0x011E: 'XPosition',
    0x0211: 'YCbCrCoefficients',
    0x0213: 'YCbCrPositioning',
    0x0212: 'YCbCrSubSampling',
    0x0159: 'YClipPathUnits',
    0x011F: 'YPosition',

    // EXIF
    0x9202: 'ApertureValue',
    0xA001: 'ColorSpace',
    0x9004: 'DateTimeDigitized',
    0x9003: 'DateTimeOriginal',
    0x8769: 'Exif IFD',
    0x9000: 'ExifVersion',
    0x829A: 'ExposureTime',
    0xA300: 'FileSource',
    0x9209: 'Flash',
    0xA000: 'FlashpixVersion',
    0x829D: 'FNumber',
    0xA420: 'ImageUniqueID',
    0x9208: 'LightSource',
    0x927C: 'MakerNote',
    0x9201: 'ShutterSpeedValue',
    0x9286: 'UserComment',

    // IPTC
    0x83BB: 'IPTC',

    // ICC
    0x8773: 'ICC Profile',

    // XMP
    0x02BC: 'XMP',

    // GDAL
    0xA480: 'GDAL_METADATA',
    0xA481: 'GDAL_NODATA',

    // Photoshop
    0x8649: 'Photoshop',
    
    // GeoTiff
    0x830E: 'ModelPixelScale',
    0x8482: 'ModelTiepoint',
    0x85D8: 'ModelTransformation',
    0x87AF: 'GeoKeyDirectory',
    0x87B0: 'GeoDoubleParams',
    0x87B1: 'GeoAsciiParams'
  };

  var key;
  var fieldTags = {};
  for (key in fieldTagNames) {
    fieldTags[fieldTagNames[key]] = parseInt(key);
  }

  var arrayFields = [
    fieldTags.BitsPerSample,
    fieldTags.ExtraSamples,
    fieldTags.RowsPerStrip,
    fieldTags.SampleFormat,
    fieldTags.StripByteCounts,
    fieldTags.StripOffsets,
    fieldTags.StripRowCounts,
    fieldTags.TileByteCounts,
    fieldTags.TileOffsets
  ];

  var fieldTypeNames = {
    0x0001: 'BYTE',
    0x0002: 'ASCII',
    0x0003: 'SHORT',
    0x0004: 'LONG',
    0x0005: 'RATIONAL',
    0x0006: 'SBYTE',
    0x0007: 'UNDEFINED',
    0x0008: 'SSHORT',
    0x0009: 'SLONG',
    0x000A: 'SRATIONAL',
    0x000B: 'FLOAT',
    0x000C: 'DOUBLE'
  };

  var fieldTypes = {};
  for (key in fieldTypeNames) {
    fieldTypes[fieldTypeNames[key]] = parseInt(key);
  }

  var parse = function(data) {
    var rawData;
    if (typeof data === "string" || data instanceof String) {
      rawData = new ArrayBuffer(data.length * 2); // 2 bytes for each char
      var view = new Uint16Array(rawData);
      for (var i=0, strLen=data.length; i<strLen; i++) {
        view[i] = data.charCodeAt(i);
      }
    }
    else if (data instanceof ArrayBuffer) {
      rawData = data;
    }
    else {
      throw new Error("Invalid input data given.");
    }
    return new Parser(rawData);
  };
  
  var Parser = function(rawData) {
    this.dataView = new DataView(rawData);

    var BOM = this.dataView.getUint16(0, 0);
    if (BOM === 0x4949) {
      this.littleEndian = true;
    }
    else if (BOM === 0x4D4D) {
      this.littleEndian = false;
    }
    else {
      throw new TypeError("Invalid byte order value.");
    }

    if (this.dataView.getUint16(2, this.littleEndian) !== 42) {
      throw new TypeError("Invalid magic number.");
    }

    this.fileDirectories = this.parseFileDirectories(
      this.dataView.getUint32(4, this.littleEndian)
    );
  };

  Parser.prototype = {
    getFieldTypeLength: function (fieldType) {
      switch (fieldType) {
        case fieldTypes.BYTE: case fieldTypes.ASCII: case fieldTypes.SBYTE: case fieldTypes.UNDEFINED:
          return 1;
        case fieldTypes.SHORT: case fieldTypes.SSHORT:
          return 2;
        case fieldTypes.LONG: case fieldTypes.SLONG: case fieldTypes.FLOAT:
          return 4;
        case fieldTypes.RATIONAL: case fieldTypes.SRATIONAL: case fieldTypes.DOUBLE:
          return 8;
        default:
          throw new RangeError("Invalid field type: " + fieldType);
      }
    },

    getValues: function(fieldType, count, offset) {
      var values = null;
      var readMethod = null;
      var fieldTypeLength = this.getFieldTypeLength(fieldType);
      var i;

      switch (fieldType) {
        case fieldTypes.BYTE: case fieldTypes.ASCII: case fieldTypes.UNDEFINED:
          values = new Uint8Array(count); readMethod = this.dataView.getUint8;
          break;
        case fieldTypes.SBYTE:
          values = new Int8Array(count); readMethod = this.dataView.getInt8;
          break;
        case fieldTypes.SHORT:
          values = new Uint16Array(count); readMethod = this.dataView.getUint16;
          break;
        case fieldTypes.SSHORT:
          values = new Int16Array(count); readMethod = this.dataView.getInt16;
          break;
        case fieldTypes.LONG:
          values = new Uint32Array(count); readMethod = this.dataView.getUint32;
          break;
        case fieldTypes.SLONG:
          values = new Int32Array(count); readMethod = this.dataView.getInt32;
          break;
        case fieldTypes.RATIONAL:
          values = new Uint32Array(count*2); readMethod = this.dataView.getUint32;
          break;
        case fieldTypes.SRATIONAL:
          values = new Int32Array(count*2); readMethod = this.dataView.getInt32;
          break;
        case fieldTypes.FLOAT:
          values = new Float32Array(count); readMethod = this.dataView.getFloat32;
          break;
        case fieldTypes.DOUBLE:
          values = new Float64Array(count); readMethod = this.dataView.getFloat64;
          break;
        default:
          throw new RangeError("Invalid field type: " + fieldType);
      }

      // normal fields
      if (!(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)) {
        for (i=0; i < count; ++i) {
          values[i] = readMethod.call(
            this.dataView, offset + (i*fieldTypeLength), this.littleEndian
          );
        }
      }
      // RATIONAL or SRATIONAL
      else {
        for (i=0; i < (count*2); i+=2) {
          values[i] = readMethod.call(
            this.dataView, offset + (i*fieldTypeLength), this.littleEndian
          );
          values[i+1] = readMethod.call(
            this.dataView, offset + ((i+1)*fieldTypeLength), this.littleEndian
          );
        }
      }

      if (fieldType === fieldTypes.ASCII) {
        return String.fromCharCode.apply(null, values);
      }
      return values;
    },

    getFieldValues: function (fieldTag, fieldType, typeCount, valueOffset) {
      var fieldValues;
      var fieldTypeLength = this.getFieldTypeLength(fieldType);

      if (fieldTypeLength * typeCount <= 4) {
        fieldValues = this.getValues(fieldType, typeCount, valueOffset);
      }
      else {
        var actualOffset = this.dataView.getUint32(valueOffset, this.littleEndian);
        fieldValues = this.getValues(fieldType, typeCount, actualOffset);
      }

      if (typeCount === 1 && arrayFields.indexOf(fieldTag) === -1 && !(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)) {
        return fieldValues[0];
      }

      return fieldValues;
    },

    parseFileDirectories: function (byteOffset) {
      var nextIFDByteOffset = byteOffset;
      var fileDirectories = [];

      while (nextIFDByteOffset !== 0x00000000) {
        var numDirEntries = this.dataView.getUint16(nextIFDByteOffset, this.littleEndian);
        var fileDirectory = {};

        for (var i = byteOffset + 2, entryCount = 0; entryCount < numDirEntries; i += 12, ++entryCount) {
          var fieldTag = this.dataView.getUint16(i, this.littleEndian);
          var fieldType = this.dataView.getUint16(i + 2, this.littleEndian);
          var typeCount = this.dataView.getUint32(i + 4, this.littleEndian);

          fileDirectory[fieldTagNames[fieldTag]] = this.getFieldValues(
            fieldTag, fieldType, typeCount, i + 8
          );
        }
        fileDirectories.push(fileDirectory);

        nextIFDByteOffset = this.dataView.getUint32(i, this.littleEndian);
      }
      return fileDirectories;
    },

    getImage: function(index) {
      var fileDirectory = this.fileDirectories[index];
      if (!fileDirectory) {
        throw new RangeError("Invalid image index");
      }
      return new ImageFile(fileDirectory, this.dataView, this.littleEndian);
    },
  };


  var ImageFile = function(fileDirectory, dataView, littleEndian) {
    this.fileDirectory = fileDirectory;
    this.dataView = dataView;
    this.littleEndian = littleEndian;
    this.tiles = {};
    this.isTiled = (fileDirectory.StripOffsets) ? false : true;
  };

  ImageFile.prototype = {
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

    _getBlock: function(offset, byteCount, outSize) {
      //byteCount = (byteCount % 2) ? byteCount + 1 : byteCount;
      var slice = this.dataView.buffer.slice(offset, offset + byteCount);
      switch (this.fileDirectory.Compression) {
        case 1:  // no compression
          return new DataView(slice);
        case 5: // LZW
          //var decompressed = LZW.decompressBuffer(slice);
          //return new DataView(decompressed);
          break;
        case 8:
          //return new DataView(pako.inflate(new Uint8Array(slice), {}).buffer);
          break;
        case 6: // JPEG
          throw new Error("JPEG compression not supported.");
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
    getTileOrStrip: function(x, y) {
      var numTilesPerRow = Math.ceil(this.getWidth() / this.getTileWidth());
      var index = y * numTilesPerRow + x;
      var offset, byteCount;
      if (index in this.tiles) {
        return this.tiles[index];
      }
      else {
        if (this.isTiled) {
          offset = this.fileDirectory.TileOffsets[index];
          byteCount = this.fileDirectory.TileByteCounts[index];
        }
        else {
          offset = this.fileDirectory.StripOffsets[index];
          byteCount = this.fileDirectory.StripByteCounts[index];
        }
        return this.tiles[index] = this._getBlock(offset, byteCount);
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
        srcSampleOffsets.push(sum(this.fileDirectory.BitsPerSample, 0, samples[i]) / 8);
        sampleReaders.push(this.getReaderForSample(samples[i]));
      }

      for (var yTile = minYTile; yTile <= maxYTile; ++yTile) {
        for (var xTile = minXTile; xTile <= maxXTile; ++xTile) {
          var tile = this.getTileOrStrip(xTile, yTile);
          var firstLine = yTile * tileHeight;
          var firstCol = xTile * tileWidth;
          var lastLine = (yTile + 1) * tileHeight;
          var lastCol = (xTile + 1) * tileWidth;

          for (var y = Math.max(0, imageWindow[1] - firstLine); y < Math.min(tileHeight, tileHeight - (lastLine - imageWindow[3])); ++y) {
            for (var x = Math.max(0, imageWindow[0] - firstCol); x < Math.min(tileWidth, tileWidth - (lastCol - imageWindow[2])); ++x) {
              var pixelOffset = (y * tileWidth + x) * bytesPerPixel;
              var windowCoordinate = (
                y + firstLine - imageWindow[1]
              ) * windowWidth + x + firstCol - imageWindow[0];
              
              for (var sampleIndex = 0; sampleIndex < samples.length; ++sampleIndex) {
                var sample = samples[sampleIndex];
                valueArrays[sampleIndex][windowCoordinate] = sampleReaders[sampleIndex].call(tile, pixelOffset + srcSampleOffsets[sampleIndex], this.littleEndian);
              }
            }
          }
        }
      }
    },

    readRasters: function(imageWindow, samples) {
      imageWindow = imageWindow || [0, 0, this.getWidth(), this.getHeight()];
      // TODO: check imageWindow

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

  var sum = function(array, start, end) {
    var s = 0;
    for (var i = start; i < end; ++i) {
      s += array[i];
    }
    return s;
  };

  // TODO: make this more efficient
  function decodeLZW(rawData, outSize, littleEndian) {
    var dict = {};

    var result = new ArrayBuffer(outSize);
    var reader = new DataView(rawData);
    var writer = new DataView(result);
    var writeIndex = 0;
    var currChar = reader.getUint16(0, littleEndian);
    var oldPhrase = [currChar];

    var code = 256;
    var phrase;

    for (var i = 1; i < rawData.byteLength; i += 2) {
      var currCode = reader.getUint16(i, littleEndian);
      if (currCode < 256) {
        phrase = [currCode];
      }
      else {
        if (dict[currCode]) {
          phrase = dict[currCode];
        }
        else {
          phrase = new Array(oldPhrase);
          phrase.push(currChar);
        }
        phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
      }
      for (var j = 0; j < phrase.length; ++i) {
        writer.setUint16(writeIndex, phrase[i], littleEndian);
        writeIndex += 2;
      }
      currChar = phrase[0];
      dict[code] = oldPhrase + [currChar];
      ++code;
      oldPhrase = phrase;
    }
    return result;
  }

  function decodeDeflate(rawData, outSize, littleEndian) {

  }

  return {parse: parse};
})();


