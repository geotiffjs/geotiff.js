(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AbstractDecoder = function () {
  function AbstractDecoder() {
    _classCallCheck(this, AbstractDecoder);
  }

  _createClass(AbstractDecoder, [{
    key: "isAsync",
    value: function isAsync() {
      // TODO: check if async reading func is enabled or not.
      return !this.decodeBlock;
    }
  }]);

  return AbstractDecoder;
}();

exports.default = AbstractDecoder;

},{}],2:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _abstractdecoder = require("../abstractdecoder.js");

var _abstractdecoder2 = _interopRequireDefault(_abstractdecoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
var Buffer = require('buffer');
var inflate = require('inflate');
var through = require('through');
*/

var DeflateDecoder = function (_AbstractDecoder) {
  _inherits(DeflateDecoder, _AbstractDecoder);

  function DeflateDecoder() {
    _classCallCheck(this, DeflateDecoder);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(DeflateDecoder).apply(this, arguments));
  }

  _createClass(DeflateDecoder, [{
    key: "decodeBlockAsync",
    value: function decodeBlockAsync(buffer, callback) {
      // through(function (data) {
      //   this.queue(new Buffer(new Uint8Array(buffer)));
      // },
      // function() {
      //   this.queue(null);
      // })
      // .pipe(inflate())
      // /*.pipe(function() {
      //   alert(arguments);
      // })*/
      // .on("data", function(data) {
      //   buffers.push(data);
      // })
      // .on("end", function() {
      //   var buffer = Buffer.concat(buffers);
      //   var arrayBuffer = new ArrayBuffer(buffer.length);
      //   var view = new Uint8Array(ab);
      //   for (var i = 0; i < buffer.length; ++i) {
      //       view[i] = buffer[i];
      //   }
      //   callback(null, arrayBuffer);
      // })
      // .on("error", function(error) {
      //   callback(error, null)
      // });
      throw new Error("DeflateDecoder is not yet implemented.");
    }
  }]);

  return DeflateDecoder;
}(_abstractdecoder2.default);

exports.default = DeflateDecoder;

},{"../abstractdecoder.js":1}],3:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _abstractdecoder = require("../abstractdecoder.js");

var _abstractdecoder2 = _interopRequireDefault(_abstractdecoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

//var lzwCompress = require("lzwcompress");

var LZWDecoder = function (_AbstractDecoder) {
  _inherits(LZWDecoder, _AbstractDecoder);

  function LZWDecoder() {
    _classCallCheck(this, LZWDecoder);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(LZWDecoder).apply(this, arguments));
  }

  _createClass(LZWDecoder, [{
    key: "decodeBlock",
    value: function decodeBlock(buffer) {
      throw new Error("LZWDecoder is not yet implemented");
      //return lzwCompress.unpack(Array.prototype.slice.call(new Uint8Array(buffer)));
    }
  }]);

  return LZWDecoder;
}(_abstractdecoder2.default);

exports.default = LZWDecoder;

},{"../abstractdecoder.js":1}],4:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _abstractdecoder = require("../abstractdecoder.js");

var _abstractdecoder2 = _interopRequireDefault(_abstractdecoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PackbitsDecoder = function (_AbstractDecoder) {
  _inherits(PackbitsDecoder, _AbstractDecoder);

  function PackbitsDecoder() {
    _classCallCheck(this, PackbitsDecoder);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(PackbitsDecoder).apply(this, arguments));
  }

  _createClass(PackbitsDecoder, [{
    key: "decodeBlock",
    value: function decodeBlock(buffer) {
      var dataView = new DataView(buffer);
      var out = [];

      for (var i = 0; i < buffer.byteLength; ++i) {
        var header = dataView.getInt8(i);
        if (header < 0) {
          var next = dataView.getUint8(i + 1);
          header = -header;
          for (var j = 0; j <= header; ++j) {
            out.push(next);
          }
          i += 1;
        } else {
          for (var j = 0; j <= header; ++j) {
            out.push(dataView.getUint8(i + j + 1));
          }
          i += header + 1;
        }
      }
      return new Uint8Array(out).buffer;
    }
  }]);

  return PackbitsDecoder;
}(_abstractdecoder2.default);

exports.default = PackbitsDecoder;

},{"../abstractdecoder.js":1}],5:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _abstractdecoder = require("../abstractdecoder.js");

var _abstractdecoder2 = _interopRequireDefault(_abstractdecoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RawDecoder = function (_AbstractDecoder) {
  _inherits(RawDecoder, _AbstractDecoder);

  function RawDecoder() {
    _classCallCheck(this, RawDecoder);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(RawDecoder).apply(this, arguments));
  }

  _createClass(RawDecoder, [{
    key: "decodeBlock",
    value: function decodeBlock(buffer) {
      return buffer;
    }
  }]);

  return RawDecoder;
}(_abstractdecoder2.default);

exports.default = RawDecoder;

},{"../abstractdecoder.js":1}],6:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _globals = require("./globals");

var _geotiffimage = require("./geotiffimage.js");

var _geotiffimage2 = _interopRequireDefault(_geotiffimage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GeoTIFF = function () {
  /**
   * The abstraction for a whole GeoTIFF file.
   * @constructor
   * @param {ArrayBuffer} rawData the raw data stream of the file as an ArrayBuffer.
   */

  function GeoTIFF(rawData) {
    _classCallCheck(this, GeoTIFF);

    this.dataView = new DataView(rawData);

    var BOM = this.dataView.getUint16(0, 0);
    if (BOM === 0x4949) {
      this.littleEndian = true;
    } else if (BOM === 0x4D4D) {
      this.littleEndian = false;
    } else {
      throw new TypeError("Invalid byte order value.");
    }

    if (this.dataView.getUint16(2, this.littleEndian) !== 42) {
      throw new TypeError("Invalid magic number.");
    }

    this.fileDirectories = this.parseFileDirectories(this.dataView.getUint32(4, this.littleEndian));
  }

  _createClass(GeoTIFF, [{
    key: "getFieldTypeLength",
    value: function getFieldTypeLength(fieldType) {
      switch (fieldType) {
        case _globals.fieldTypes.BYTE:case _globals.fieldTypes.ASCII:case _globals.fieldTypes.SBYTE:case _globals.fieldTypes.UNDEFINED:
          return 1;
        case _globals.fieldTypes.SHORT:case _globals.fieldTypes.SSHORT:
          return 2;
        case _globals.fieldTypes.LONG:case _globals.fieldTypes.SLONG:case _globals.fieldTypes.FLOAT:
          return 4;
        case _globals.fieldTypes.RATIONAL:case _globals.fieldTypes.SRATIONAL:case _globals.fieldTypes.DOUBLE:
          return 8;
        default:
          throw new RangeError("Invalid field type: " + fieldType);
      }
    }
  }, {
    key: "getValues",
    value: function getValues(fieldType, count, offset) {
      var values = null;
      var readMethod = null;
      var fieldTypeLength = this.getFieldTypeLength(fieldType);
      var i;

      switch (fieldType) {
        case _globals.fieldTypes.BYTE:case _globals.fieldTypes.ASCII:case _globals.fieldTypes.UNDEFINED:
          values = new Uint8Array(count);readMethod = this.dataView.getUint8;
          break;
        case _globals.fieldTypes.SBYTE:
          values = new Int8Array(count);readMethod = this.dataView.getInt8;
          break;
        case _globals.fieldTypes.SHORT:
          values = new Uint16Array(count);readMethod = this.dataView.getUint16;
          break;
        case _globals.fieldTypes.SSHORT:
          values = new Int16Array(count);readMethod = this.dataView.getInt16;
          break;
        case _globals.fieldTypes.LONG:
          values = new Uint32Array(count);readMethod = this.dataView.getUint32;
          break;
        case _globals.fieldTypes.SLONG:
          values = new Int32Array(count);readMethod = this.dataView.getInt32;
          break;
        case _globals.fieldTypes.RATIONAL:
          values = new Uint32Array(count * 2);readMethod = this.dataView.getUint32;
          break;
        case _globals.fieldTypes.SRATIONAL:
          values = new Int32Array(count * 2);readMethod = this.dataView.getInt32;
          break;
        case _globals.fieldTypes.FLOAT:
          values = new Float32Array(count);readMethod = this.dataView.getFloat32;
          break;
        case _globals.fieldTypes.DOUBLE:
          values = new Float64Array(count);readMethod = this.dataView.getFloat64;
          break;
        default:
          throw new RangeError("Invalid field type: " + fieldType);
      }

      // normal fields
      if (!(fieldType === _globals.fieldTypes.RATIONAL || fieldType === _globals.fieldTypes.SRATIONAL)) {
        for (i = 0; i < count; ++i) {
          values[i] = readMethod.call(this.dataView, offset + i * fieldTypeLength, this.littleEndian);
        }
      }
      // RATIONAL or SRATIONAL
      else {
          for (i = 0; i < count * 2; i += 2) {
            values[i] = readMethod.call(this.dataView, offset + i * fieldTypeLength, this.littleEndian);
            values[i + 1] = readMethod.call(this.dataView, offset + (i + 1) * fieldTypeLength, this.littleEndian);
          }
        }

      if (fieldType === _globals.fieldTypes.ASCII) {
        return String.fromCharCode.apply(null, values);
      }
      return values;
    }
  }, {
    key: "getFieldValues",
    value: function getFieldValues(fieldTag, fieldType, typeCount, valueOffset) {
      var fieldValues;
      var fieldTypeLength = this.getFieldTypeLength(fieldType);

      if (fieldTypeLength * typeCount <= 4) {
        fieldValues = this.getValues(fieldType, typeCount, valueOffset);
      } else {
        var actualOffset = this.dataView.getUint32(valueOffset, this.littleEndian);
        fieldValues = this.getValues(fieldType, typeCount, actualOffset);
      }

      if (typeCount === 1 && _globals.arrayFields.indexOf(fieldTag) === -1 && !(fieldType === _globals.fieldTypes.RATIONAL || fieldType === _globals.fieldTypes.SRATIONAL)) {
        return fieldValues[0];
      }

      return fieldValues;
    }
  }, {
    key: "parseGeoKeyDirectory",
    value: function parseGeoKeyDirectory(fileDirectory) {
      var rawGeoKeyDirectory = fileDirectory.GeoKeyDirectory;
      if (!rawGeoKeyDirectory) {
        return null;
      }

      var geoKeyDirectory = {};
      for (var i = 4; i < rawGeoKeyDirectory[3] * 4; i += 4) {
        var key = _globals.geoKeyNames[rawGeoKeyDirectory[i]],
            location = rawGeoKeyDirectory[i + 1] ? _globals.fieldTagNames[rawGeoKeyDirectory[i + 1]] : null,
            count = rawGeoKeyDirectory[i + 2],
            offset = rawGeoKeyDirectory[i + 3];

        var value = null;
        if (!location) {
          value = offset;
        } else {
          value = fileDirectory[location];
          if (typeof value === "undefined" || value === null) {
            throw new Error("Could not get value of geoKey '" + key + "'.");
          } else if (typeof value === "string") {
            value = value.substring(offset, offset + count - 1);
          } else if (value.subarray) {
            value = value.subarray(offset, offset + count - 1);
          }
        }
        geoKeyDirectory[key] = value;
      }
      return geoKeyDirectory;
    }
  }, {
    key: "parseFileDirectories",
    value: function parseFileDirectories(byteOffset) {
      var nextIFDByteOffset = byteOffset;
      var fileDirectories = [];

      while (nextIFDByteOffset !== 0x00000000) {
        var numDirEntries = this.dataView.getUint16(nextIFDByteOffset, this.littleEndian);
        var fileDirectory = {};

        for (var i = byteOffset + 2, entryCount = 0; entryCount < numDirEntries; i += 12, ++entryCount) {
          var fieldTag = this.dataView.getUint16(i, this.littleEndian);
          var fieldType = this.dataView.getUint16(i + 2, this.littleEndian);
          var typeCount = this.dataView.getUint32(i + 4, this.littleEndian);

          fileDirectory[_globals.fieldTagNames[fieldTag]] = this.getFieldValues(fieldTag, fieldType, typeCount, i + 8);
        }
        fileDirectories.push([fileDirectory, this.parseGeoKeyDirectory(fileDirectory)]);

        nextIFDByteOffset = this.dataView.getUint32(i, this.littleEndian);
      }
      return fileDirectories;
    }

    /**
     * Get the n-th internal subfile a an image. By default, the first is returned.
     *
     * @param {Number} [index=0] the index of the image to return.
     * @returns {GeoTIFFImage} the image at the given index
     */

  }, {
    key: "getImage",
    value: function getImage(index) {
      index = index || 0;
      var fileDirectoryAndGeoKey = this.fileDirectories[index];
      if (!fileDirectoryAndGeoKey) {
        throw new RangeError("Invalid image index");
      }
      return new _geotiffimage2.default(fileDirectoryAndGeoKey[0], fileDirectoryAndGeoKey[1], this.dataView, this.littleEndian);
    }

    /**
     * Returns the count of the internal subfiles.
     * 
     * @returns {Number} the number of internal subfile images
     */

  }, {
    key: "getImageCount",
    value: function getImageCount() {
      return this.fileDirectories.length;
    }
  }]);

  return GeoTIFF;
}();

exports.default = GeoTIFF;

},{"./geotiffimage.js":7,"./globals":8}],7:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _globals = require("./globals");

var _raw = require("./compression/raw.js");

var _raw2 = _interopRequireDefault(_raw);

var _lzw = require("./compression/lzw.js");

var _lzw2 = _interopRequireDefault(_lzw);

var _deflate = require("./compression/deflate.js");

var _deflate2 = _interopRequireDefault(_deflate);

var _packbits = require("./compression/packbits.js");

var _packbits2 = _interopRequireDefault(_packbits);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sum = function sum(array, start, end) {
  var s = 0;
  for (var i = start; i < end; ++i) {
    s += array[i];
  }
  return s;
};

var GeoTIFFImage = function () {
  /**
   * GeoTIFF sub-file image.
   * @constructor
   * @param {Object} fileDirectory The parsed file directory
   * @param {Object} geoKeys The parsed geo-keys
   * @param {DataView} dataView The DataView for the underlying file.
   * @param {Boolean} littleEndian Whether the file is encoded in little or big endian
   */

  function GeoTIFFImage(fileDirectory, geoKeys, dataView, littleEndian) {
    _classCallCheck(this, GeoTIFFImage);

    this.fileDirectory = fileDirectory;
    this.geoKeys = geoKeys;
    this.dataView = dataView;
    this.littleEndian = littleEndian;
    this.tiles = {};
    this.isTiled = fileDirectory.StripOffsets ? false : true;
    var planarConfiguration = fileDirectory.PlanarConfiguration;
    this.planarConfiguration = typeof planarConfiguration === "undefined" ? 1 : planarConfiguration;
    if (this.planarConfiguration !== 1 && this.planarConfiguration !== 2) {
      throw new Error("Invalid planar configuration.");
    }

    switch (this.fileDirectory.Compression) {
      case 1:
        // no compression
        this.decoder = new _raw2.default();
        break;
      case 5:
        // LZW
        this.decoder = new _lzw2.default();
        break;
      case 6:
        // JPEG
        throw new Error("JPEG compression not supported.");
      case 8:
        // Deflate
        this.decoder = new _deflate2.default();
        break;
      //case 32946: // deflate ??
      //  throw new Error("Deflate compression not supported.");
      case 32773:
        // packbits
        this.decoder = new _packbits2.default();
        break;
      default:
        throw new Error("Unknown compresseion method identifier: " + this.fileDirectory.Compression);
    }
  }
  /**
   * Returns the associated parsed file directory.
   * @returns {Object} the parsed file directory
   */

  _createClass(GeoTIFFImage, [{
    key: "getFileDirectory",
    value: function getFileDirectory() {
      return this.fileDirectory;
    }
    /**
    * Returns the associated parsed geo keys.
    * @returns {Object} the parsed geo keys
    */

  }, {
    key: "getGeoKeys",
    value: function getGeoKeys() {
      return this.geoKeys;
    }
    /**
     * Returns the width of the image.
     * @returns {Number} the width of the image
     */

  }, {
    key: "getWidth",
    value: function getWidth() {
      return this.fileDirectory.ImageWidth;
    }
    /**
     * Returns the height of the image.
     * @returns {Number} the height of the image
     */

  }, {
    key: "getHeight",
    value: function getHeight() {
      return this.fileDirectory.ImageLength;
    }
    /**
     * Returns the number of samples per pixel.
     * @returns {Number} the number of samples per pixel
     */

  }, {
    key: "getSamplesPerPixel",
    value: function getSamplesPerPixel() {
      return this.fileDirectory.SamplesPerPixel;
    }
    /**
     * Returns the width of each tile.
     * @returns {Number} the width of each tile
     */

  }, {
    key: "getTileWidth",
    value: function getTileWidth() {
      return this.isTiled ? this.fileDirectory.TileWidth : this.getWidth();
    }
    /**
     * Returns the height of each tile.
     * @returns {Number} the height of each tile
     */

  }, {
    key: "getTileHeight",
    value: function getTileHeight() {
      return this.isTiled ? this.fileDirectory.TileLength : this.fileDirectory.RowsPerStrip;
    }

    /**
     * Calculates the number of bytes for each pixel across all samples. Only full
     * bytes are supported, an exception is thrown when this is not the case.
     * @returns {Number} the bytes per pixel
     */

  }, {
    key: "getBytesPerPixel",
    value: function getBytesPerPixel() {
      var bitsPerSample = 0;
      for (var i = 0; i < this.fileDirectory.BitsPerSample.length; ++i) {
        var bits = this.fileDirectory.BitsPerSample[i];
        if (bits % 8 !== 0) {
          throw new Error("Sample bit-width of " + bits + " is not supported.");
        } else if (bits !== this.fileDirectory.BitsPerSample[0]) {
          throw new Error("Differing size of samples in a pixel are not supported.");
        }
        bitsPerSample += bits;
      }
      return bitsPerSample / 8;
    }
  }, {
    key: "getSampleByteSize",
    value: function getSampleByteSize(i) {
      if (i >= this.fileDirectory.BitsPerSample.length) {
        throw new RangeError("Sample index " + i + " is out of range.");
      }
      var bits = this.fileDirectory.BitsPerSample[i];
      if (bits % 8 !== 0) {
        throw new Error("Sample bit-width of " + bits + " is not supported.");
      }
      return bits / 8;
    }
  }, {
    key: "getReaderForSample",
    value: function getReaderForSample(sampleIndex) {
      var format = this.fileDirectory.SampleFormat[sampleIndex];
      var bitsPerSample = this.fileDirectory.BitsPerSample[sampleIndex];
      switch (format) {
        case 1:
          // unsigned integer data
          switch (bitsPerSample) {
            case 8:
              return DataView.prototype.getUint8;
            case 16:
              return DataView.prototype.getUint16;
            case 32:
              return DataView.prototype.getUint32;
          }
          break;
        case 2:
          // twos complement signed integer data
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
    }
  }, {
    key: "getArrayForSample",
    value: function getArrayForSample(sampleIndex, size) {
      var format = this.fileDirectory.SampleFormat[sampleIndex];
      var bitsPerSample = this.fileDirectory.BitsPerSample[sampleIndex];
      switch (format) {
        case 1:
          // unsigned integer data
          switch (bitsPerSample) {
            case 8:
              return new Uint8Array(size);
            case 16:
              return new Uint16Array(size);
            case 32:
              return new Uint32Array(size);
          }
          break;
        case 2:
          // twos complement signed integer data
          switch (bitsPerSample) {
            case 8:
              return new Int8Array(size);
            case 16:
              return new Int16Array(size);
            case 32:
              return new Int32Array(size);
          }
          break;
        case 3:
          // floating point data
          switch (bitsPerSample) {
            case 32:
              return new Float32Array(size);
            case 64:
              return new Float64Array(size);
          }
          break;
      }
      throw Error("Unsupported data format/bitsPerSample");
    }
  }, {
    key: "getDecoder",
    value: function getDecoder() {
      return this.decoder;
    }

    /**
     * Returns the decoded strip or tile.
     * @param {Number} x the strip or tile x-offset
     * @param {Number} y the tile y-offset (0 for stripped images)
     * @param {Number} plane the planar configuration (1: "chunky", 2: "separate samples")
     * @returns {(Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array)}
     */

  }, {
    key: "getTileOrStripAsync",
    value: function getTileOrStripAsync(x, y, sample, callback) {
      var numTilesPerRow = Math.ceil(this.getWidth() / this.getTileWidth());
      var numTilesPerCol = Math.ceil(this.getHeight() / this.getTileHeight());
      var index;
      var tiles = this.tiles;
      if (this.planarConfiguration === 1) {
        index = y * numTilesPerRow + x;
      } else if (this.planarConfiguration === 2) {
        index = sample * numTilesPerRow * numTilesPerCol + y * numTilesPerRow + x;
      }

      if (index in this.tiles && false) {
        return callback(null, {
          x: x, y: y, sample: sample, data: tiles[index]
        });
      } else {
        var offset, byteCount;
        if (this.isTiled) {
          offset = this.fileDirectory.TileOffsets[index];
          byteCount = this.fileDirectory.TileByteCounts[index];
        } else {
          offset = this.fileDirectory.StripOffsets[index];
          byteCount = this.fileDirectory.StripByteCounts[index];
        }
        var slice = this.dataView.buffer.slice(offset, offset + byteCount);
        return this.getDecoder().decodeBlockAsync(slice, function (error, data) {
          if (!error) {
            tiles[index] = data;
          }
          callback(error, { x: x, y: y, sample: sample, data: data });
        });
      }
    }
  }, {
    key: "getTileOrStrip",
    value: function getTileOrStrip(x, y, sample) {
      var numTilesPerRow = Math.ceil(this.getWidth() / this.getTileWidth());
      var numTilesPerCol = Math.ceil(this.getHeight() / this.getTileHeight());
      var index;
      if (this.planarConfiguration === 1) {
        index = y * numTilesPerRow + x;
      } else if (this.planarConfiguration === 2) {
        index = sample * numTilesPerRow * numTilesPerCol + y * numTilesPerRow + x;
      }

      if (index in this.tiles) {
        return this.tiles[index];
      } else {
        var offset, byteCount;
        if (this.isTiled) {
          offset = this.fileDirectory.TileOffsets[index];
          byteCount = this.fileDirectory.TileByteCounts[index];
        } else {
          offset = this.fileDirectory.StripOffsets[index];
          byteCount = this.fileDirectory.StripByteCounts[index];
        }
        var slice = this.dataView.buffer.slice(offset, offset + byteCount);
        return this.tiles[index] = this.getDecoder().decodeBlock(slice);
      }
    }
  }, {
    key: "_readRasterAsync",
    value: function _readRasterAsync(imageWindow, samples, valueArrays, callback, callbackError) {
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
      for (var i = 0; i < samples.length; ++i) {
        if (this.planarConfiguration === 1) {
          srcSampleOffsets.push(sum(this.fileDirectory.BitsPerSample, 0, samples[i]) / 8);
        } else {
          srcSampleOffsets.push(0);
        }
        sampleReaders.push(this.getReaderForSample(samples[i]));
      }

      var allStacked = false;
      var unfinishedTiles = 0;
      var littleEndian = this.littleEndian;
      var globalError = null;

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
              var windowCoordinate = (y + firstLine - imageWindow[1]) * windowWidth + x + firstCol - imageWindow[0];
              valueArrays[_sampleIndex][windowCoordinate] = sampleReaders[_sampleIndex].call(dataView, pixelOffset + srcSampleOffsets[_sampleIndex], littleEndian);
            }
          }
        } else {
          globalError = error;
        }

        // check end condition and call callbacks
        unfinishedTiles -= 1;
        checkFinished();
      }

      function checkFinished() {
        if (allStacked && unfinishedTiles === 0) {
          if (globalError) {
            callbackError(globalError);
          } else {
            callback(valueArrays);
          }
        }
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
            this.getTileOrStripAsync(xTile, yTile, sample, onTileGot);
          }
        }
      }
      allStacked = true;
      checkFinished();
    }
  }, {
    key: "_readRaster",
    value: function _readRaster(imageWindow, samples, valueArrays, callback, callbackError) {
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

        var srcSampleOffsets = [];
        var sampleReaders = [];
        for (var i = 0; i < samples.length; ++i) {
          if (this.planarConfiguration === 1) {
            srcSampleOffsets.push(sum(this.fileDirectory.BitsPerSample, 0, samples[i]) / 8);
          } else {
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
                  var windowCoordinate = (y + firstLine - imageWindow[1]) * windowWidth + x + firstCol - imageWindow[0];
                  valueArrays[sampleIndex][windowCoordinate] = sampleReaders[sampleIndex].call(tile, pixelOffset + srcSampleOffsets[sampleIndex], this.littleEndian);
                }
              }
            }
          }
        }
        return callback(valueArrays);
      } catch (error) {
        return callbackError(error);
      }
    }

    /**
     * This callback is called upon successful reading of a GeoTIFF image. The
     * resulting arrays are passed as a single argument. 
     * @callback GeoTIFFImage~readCallback
     * @param {TypedArray[]} array the requested data as a summary array, one TypedArray for each requested sample
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
     * @param {Array} [imageWindow=whole image] the subset to read data from.
     * @param {Array} [samples=all samples] the selection of samples to read from.
     * @param {GeoTIFFImage~readCallback} callback the success callback
     * @param {GeoTIFFImage~readErrorCallback} callbackError the error callback
     */

  }, {
    key: "readRasters",
    value: function readRasters(imageWindow, samples, callback, callbackError) {
      imageWindow = imageWindow || [0, 0, this.getWidth(), this.getHeight()];

      if (imageWindow[0] < 0 || imageWindow[1] < 0 || imageWindow[2] > this.getWidth() || imageWindow[3] > this.getHeight()) {
        throw new Error("Select window is out of image bounds.");
      } else if (imageWindow[0] > imageWindow[2] || imageWindow[1] > imageWindow[3]) {
        throw new Error("Invalid subsets");
      }

      callback = callback || function () {};
      callbackError = callbackError || function () {};

      var imageWindowWidth = imageWindow[2] - imageWindow[0];
      var imageWindowHeight = imageWindow[3] - imageWindow[1];
      var numPixels = imageWindowWidth * imageWindowHeight;
      var i;

      if (!samples) {
        samples = [];
        for (i = 0; i < this.fileDirectory.SamplesPerPixel; ++i) {
          samples.push(i);
        }
      } else {
        for (i = 0; i < samples.length; ++i) {
          if (samples[i] >= this.fileDirectory.SamplesPerPixel) {
            throw new RangeError("Invalid sample index '" + samples[i] + "'.");
          }
        }
      }
      var valueArrays = [];
      for (i = 0; i < samples.length; ++i) {
        valueArrays.push(this.getArrayForSample(samples[i], numPixels));
      }

      var decoder = this.getDecoder();
      if (decoder.isAsync()) {
        return this._readRasterAsync(imageWindow, samples, valueArrays, callback, callbackError);
      } else {
        return this._readRaster(imageWindow, samples, valueArrays, callback, callbackError);
      }
    }

    /**
     * Returns an array of tiepoints.
     * @returns {Object[]}
     */

  }, {
    key: "getTiePoints",
    value: function getTiePoints() {
      if (!this.fileDirectory.ModelTiepoint) {
        return [];
      }

      var tiePoints = [];
      for (var i = 0; i < this.fileDirectory.ModelTiepoint.length; i += 6) {
        tiePoints.push({
          i: this.fileDirectory.ModelTiepoint[i],
          j: this.fileDirectory.ModelTiepoint[i + 1],
          k: this.fileDirectory.ModelTiepoint[i + 2],
          x: this.fileDirectory.ModelTiepoint[i + 3],
          y: this.fileDirectory.ModelTiepoint[i + 4],
          z: this.fileDirectory.ModelTiepoint[i + 5]
        });
      }
      return tiePoints;
    }

    /**
     * Returns the parsed GDAL metadata items.
     * @returns {Object}
     */

  }, {
    key: "getGDALMetadata",
    value: function getGDALMetadata() {
      var metadata = {};
      if (!this.fileDirectory.GDAL_METADATA) {
        return null;
      }

      var xmlDom = (0, _globals.parseXml)(this.fileDirectory.GDAL_METADATA);
      var result = xmlDom.evaluate("GDALMetadata/Item", xmlDom, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
      for (var i = 0; i < result.snapshotLength; ++i) {
        var node = result.snapshotItem(i);
        metadata[node.getAttribute("name")] = node.textContent;
      }
      return metadata;
    }
  }]);

  return GeoTIFFImage;
}();

exports.default = GeoTIFFImage;

},{"./compression/deflate.js":2,"./compression/lzw.js":3,"./compression/packbits.js":4,"./compression/raw.js":5,"./globals":8}],8:[function(require,module,exports){
'use strict';

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

var arrayFields = [fieldTags.BitsPerSample, fieldTags.ExtraSamples, fieldTags.SampleFormat, fieldTags.StripByteCounts, fieldTags.StripOffsets, fieldTags.StripRowCounts, fieldTags.TileByteCounts, fieldTags.TileOffsets];

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

var geoKeyNames = {
  1024: 'GTModelTypeGeoKey',
  1025: 'GTRasterTypeGeoKey',
  1026: 'GTCitationGeoKey',
  2048: 'GeographicTypeGeoKey',
  2049: 'GeogCitationGeoKey',
  2050: 'GeogGeodeticDatumGeoKey',
  2051: 'GeogPrimeMeridianGeoKey',
  2052: 'GeogLinearUnitsGeoKey',
  2053: 'GeogLinearUnitSizeGeoKey',
  2054: 'GeogAngularUnitsGeoKey',
  2055: 'GeogAngularUnitSizeGeoKey',
  2056: 'GeogEllipsoidGeoKey',
  2057: 'GeogSemiMajorAxisGeoKey',
  2058: 'GeogSemiMinorAxisGeoKey',
  2059: 'GeogInvFlatteningGeoKey',
  2060: 'GeogAzimuthUnitsGeoKey',
  2061: 'GeogPrimeMeridianLongGeoKey',
  2062: 'GeogTOWGS84GeoKey',
  3072: 'ProjectedCSTypeGeoKey',
  3073: 'PCSCitationGeoKey',
  3074: 'ProjectionGeoKey',
  3075: 'ProjCoordTransGeoKey',
  3076: 'ProjLinearUnitsGeoKey',
  3077: 'ProjLinearUnitSizeGeoKey',
  3078: 'ProjStdParallel1GeoKey',
  3079: 'ProjStdParallel2GeoKey',
  3080: 'ProjNatOriginLongGeoKey',
  3081: 'ProjNatOriginLatGeoKey',
  3082: 'ProjFalseEastingGeoKey',
  3083: 'ProjFalseNorthingGeoKey',
  3084: 'ProjFalseOriginLongGeoKey',
  3085: 'ProjFalseOriginLatGeoKey',
  3086: 'ProjFalseOriginEastingGeoKey',
  3087: 'ProjFalseOriginNorthingGeoKey',
  3088: 'ProjCenterLongGeoKey',
  3089: 'ProjCenterLatGeoKey',
  3090: 'ProjCenterEastingGeoKey',
  3091: 'ProjCenterNorthingGeoKey',
  3092: 'ProjScaleAtNatOriginGeoKey',
  3093: 'ProjScaleAtCenterGeoKey',
  3094: 'ProjAzimuthAngleGeoKey',
  3095: 'ProjStraightVertPoleLongGeoKey',
  3096: 'ProjRectifiedGridAngleGeoKey',
  4096: 'VerticalCSTypeGeoKey',
  4097: 'VerticalCitationGeoKey',
  4098: 'VerticalDatumGeoKey',
  4099: 'VerticalUnitsGeoKey'
};

var geoKeys = {};
for (key in geoKeyNames) {
  geoKeys[geoKeyNames[key]] = parseInt(key);
}

var parseXml;
// node.js version
if (typeof window === "undefined") {
  parseXml = function parseXml(xmlStr) {
    // requires xmldom module
    var DOMParser = require('xmldom').DOMParser;
    return new DOMParser().parseFromString(xmlStr, "text/xml");
  };
} else if (typeof window.DOMParser !== "undefined") {
  parseXml = function parseXml(xmlStr) {
    return new window.DOMParser().parseFromString(xmlStr, "text/xml");
  };
} else if (typeof window.ActiveXObject !== "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
  parseXml = function parseXml(xmlStr) {
    var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = "false";
    xmlDoc.loadXML(xmlStr);
    return xmlDoc;
  };
}

module.exports = {
  fieldTags: fieldTags,
  fieldTagNames: fieldTagNames,
  arrayFields: arrayFields,
  fieldTypes: fieldTypes,
  fieldTypeNames: fieldTypeNames,
  geoKeys: geoKeys,
  geoKeyNames: geoKeyNames,
  parseXml: parseXml
};

},{"xmldom":"xmldom"}],9:[function(require,module,exports){
"use strict";

var _geotiff = require("./geotiff.js");

var _geotiff2 = _interopRequireDefault(_geotiff);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** 
 * Main parsing function for GeoTIFF files.
 * @param {(string|ArrayBuffer)} data Raw data to parse the GeoTIFF from.
 * @returns {GeoTIFF} the parsed geotiff file.
 */
var parse = function parse(data) {
  var rawData, i, strLen, view;
  if (typeof data === "string" || data instanceof String) {
    rawData = new ArrayBuffer(data.length * 2); // 2 bytes for each char
    view = new Uint16Array(rawData);
    for (i = 0, strLen = data.length; i < strLen; i++) {
      view[i] = data.charCodeAt(i);
    }
  } else if (data instanceof ArrayBuffer) {
    rawData = data;
  } else {
    throw new Error("Invalid input data given.");
  }
  return new _geotiff2.default(rawData);
};

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports.parse = parse;
}
if (typeof window !== "undefined") {
  window["GeoTIFF"] = { parse: parse };
}

},{"./geotiff.js":6}]},{},[9]);
