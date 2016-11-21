(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn, options) {
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp && exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'], (
            // try to call default if defined to also support babel esmodule
            // exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);'
        )),
        scache
    ];

    var workerSources = {};
    resolveSources(skey);

    function resolveSources(key) {
        workerSources[key] = true;

        for (var depPath in sources[key][1]) {
            var depKey = sources[key][1][depPath];
            if (!workerSources[depKey]) {
                resolveSources(depKey);
            }
        }
    }

    var src = '(' + bundleFn + ')({'
        + Object.keys(workerSources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    var blob = new Blob([src], { type: 'text/javascript' });
    if (options && options.bare) { return blob; }
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
};

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AbstractDecoder = function () {
  function AbstractDecoder() {
    _classCallCheck(this, AbstractDecoder);
  }

  _createClass(AbstractDecoder, [{
    key: 'isAsync',
    value: function isAsync() {
      // TODO: check if async reading func is enabled or not.
      return typeof this.decodeBlock === 'undefined';
    }
  }]);

  return AbstractDecoder;
}();

exports.default = AbstractDecoder;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _abstractdecoder = require('../abstractdecoder.js');

var _abstractdecoder2 = _interopRequireDefault(_abstractdecoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DeflateDecoder = function (_AbstractDecoder) {
  _inherits(DeflateDecoder, _AbstractDecoder);

  function DeflateDecoder() {
    _classCallCheck(this, DeflateDecoder);

    return _possibleConstructorReturn(this, (DeflateDecoder.__proto__ || Object.getPrototypeOf(DeflateDecoder)).apply(this, arguments));
  }

  _createClass(DeflateDecoder, [{
    key: 'decodeBlock',
    value: function decodeBlock() {
      throw new Error("not supported");
    }
  }]);

  return DeflateDecoder;
}(_abstractdecoder2.default);

exports.default = DeflateDecoder;

},{"../abstractdecoder.js":2}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDecoder = getDecoder;

var _raw = require('./raw.js');

var _raw2 = _interopRequireDefault(_raw);

var _lzw = require('./lzw.js');

var _lzw2 = _interopRequireDefault(_lzw);

var _deflate = require('./deflate.js');

var _deflate2 = _interopRequireDefault(_deflate);

var _packbits = require('./packbits.js');

var _packbits2 = _interopRequireDefault(_packbits);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getDecoder(compression) {
  switch (compression) {
    case undefined:
    case 1:
      // no compression
      return new _raw2.default();
    case 5:
      // LZW
      return new _lzw2.default();
    case 6:
      // JPEG
      throw new Error('JPEG compression not supported.');
    case 8:
      // Deflate
      return new _deflate2.default();
    //case 32946: // deflate ??
    //  throw new Error("Deflate compression not supported.");
    case 32773:
      // packbits
      return new _packbits2.default();
    default:
      throw new Error('Unknown compression method identifier: ' + this.fileDirectory.Compression);
  }
}

},{"./deflate.js":3,"./lzw.js":5,"./packbits.js":6,"./raw.js":7}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _abstractdecoder = require('../abstractdecoder.js');

var _abstractdecoder2 = _interopRequireDefault(_abstractdecoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MIN_BITS = 9;
var MAX_BITS = 12;
var CLEAR_CODE = 256; // clear code
var EOI_CODE = 257; // end of information

var LZW = function () {
  function LZW() {
    _classCallCheck(this, LZW);

    this.littleEndian = false;
    this.position = 0;

    this._makeEntryLookup = false;
    this.dictionary = [];
  }

  _createClass(LZW, [{
    key: 'initDictionary',
    value: function initDictionary() {
      this.dictionary = new Array(258);
      this.entryLookup = {};
      this.byteLength = MIN_BITS;
      for (var i = 0; i <= 257; i++) {
        // i really feal like i <= 257, but I get strange unknown words that way.
        this.dictionary[i] = [i];
        if (this._makeEntryLookup) {
          this.entryLookup[i] = i;
        }
      }
    }
  }, {
    key: 'decompress',
    value: function decompress(input) {
      this._makeEntryLookup = false; // for speed
      this.initDictionary();
      this.position = 0;
      this.result = [];
      if (!input.buffer) {
        input = new Uint8Array(input);
      }
      var mydataview = new DataView(input.buffer);
      var code = this.getNext(mydataview);
      var oldCode;
      while (code !== EOI_CODE) {
        if (code === CLEAR_CODE) {
          this.initDictionary();
          code = this.getNext(mydataview);
          while (code === CLEAR_CODE) {
            code = this.getNext(mydataview);
          }
          if (code > CLEAR_CODE) {
            throw new Error('corrupted code at scanline ' + code);
          }
          if (code === EOI_CODE) {
            break;
          } else {
            var val = this.dictionary[code];
            this.appendArray(this.result, val);
            oldCode = code;
          }
        } else {
          if (this.dictionary[code] !== undefined) {
            var _val = this.dictionary[code];
            this.appendArray(this.result, _val);
            var newVal = this.dictionary[oldCode].concat(this.dictionary[code][0]);
            this.addToDictionary(newVal);
            oldCode = code;
          } else {
            var oldVal = this.dictionary[oldCode];
            if (!oldVal) {
              throw new Error('Bogus entry. Not in dictionary, ' + oldCode + ' / ' + this.dictionary.length + ', position: ' + this.position);
            }
            var _newVal = oldVal.concat(this.dictionary[oldCode][0]);
            this.appendArray(this.result, _newVal);
            this.addToDictionary(_newVal);
            oldCode = code;
          }
        }
        // This is strange. It seems like the
        if (this.dictionary.length >= Math.pow(2, this.byteLength) - 1) {
          this.byteLength++;
        }
        code = this.getNext(mydataview);
      }
      return new Uint8Array(this.result);
    }
  }, {
    key: 'appendArray',
    value: function appendArray(dest, source) {
      for (var i = 0; i < source.length; i++) {
        dest.push(source[i]);
      }
      return dest;
    }
  }, {
    key: 'haveBytesChanged',
    value: function haveBytesChanged() {
      if (this.dictionary.length >= Math.pow(2, this.byteLength)) {
        this.byteLength++;
        return true;
      }
      return false;
    }
  }, {
    key: 'addToDictionary',
    value: function addToDictionary(arr) {
      this.dictionary.push(arr);
      if (this._makeEntryLookup) {
        this.entryLookup[arr] = this.dictionary.length - 1;
      }
      this.haveBytesChanged();
      return this.dictionary.length - 1;
    }
  }, {
    key: 'getNext',
    value: function getNext(dataview) {
      var byte = this.getByte(dataview, this.position, this.byteLength);
      this.position += this.byteLength;
      return byte;
    }

    // This binary representation might actually be as fast as the completely illegible bit shift approach
    //

  }, {
    key: 'getByte',
    value: function getByte(dataview, position, length) {
      var d = position % 8;
      var a = Math.floor(position / 8);
      var de = 8 - d;
      var ef = position + length - (a + 1) * 8;
      var fg = 8 * (a + 2) - (position + length);
      var dg = (a + 2) * 8 - position;
      fg = Math.max(0, fg);
      if (a >= dataview.byteLength) {
        console.warn('ran off the end of the buffer before finding EOI_CODE (end on input code)');
        return EOI_CODE;
      }
      var chunk1 = dataview.getUint8(a, this.littleEndian) & Math.pow(2, 8 - d) - 1;
      chunk1 = chunk1 << length - de;
      var chunks = chunk1;
      if (a + 1 < dataview.byteLength) {
        var chunk2 = dataview.getUint8(a + 1, this.littleEndian) >>> fg;
        chunk2 = chunk2 << Math.max(0, length - dg);
        chunks += chunk2;
      }
      if (ef > 8 && a + 2 < dataview.byteLength) {
        var hi = (a + 3) * 8 - (position + length);
        var chunk3 = dataview.getUint8(a + 2, this.littleEndian) >>> hi;
        chunks += chunk3;
      }
      return chunks;
    }

    // compress has not been optimized and uses a uint8 array to hold binary values.

  }, {
    key: 'compress',
    value: function compress(input) {
      this._makeEntryLookup = true;
      this.initDictionary();
      this.position = 0;
      var resultBits = [];
      var omega = [];
      resultBits = this.appendArray(resultBits, this.binaryFromByte(CLEAR_CODE, this.byteLength)); // resultBits.concat(Array.from(this.binaryFromByte(this.CLEAR_CODE, this.byteLength)))
      for (var i = 0; i < input.length; i++) {
        var k = [input[i]];
        var omk = omega.concat(k);
        if (this.entryLookup[omk] !== undefined) {
          omega = omk;
        } else {
          var _code = this.entryLookup[omega];
          var _bin = this.binaryFromByte(_code, this.byteLength);
          resultBits = this.appendArray(resultBits, _bin);
          this.addToDictionary(omk);
          omega = k;
          if (this.dictionary.length >= Math.pow(2, MAX_BITS)) {
            resultBits = this.appendArray(resultBits, this.binaryFromByte(CLEAR_CODE, this.byteLength));
            this.initDictionary();
          }
        }
      }
      var code = this.entryLookup[omega];
      var bin = this.binaryFromByte(code, this.byteLength);
      resultBits = this.appendArray(resultBits, bin);
      resultBits = resultBits = this.appendArray(resultBits, this.binaryFromByte(EOI_CODE, this.byteLength));
      this.binary = resultBits;
      this.result = this.binaryToUint8(resultBits);
      return this.result;
    }
  }, {
    key: 'byteFromCode',
    value: function byteFromCode(code) {
      var res = this.dictionary[code];
      return res;
    }
  }, {
    key: 'binaryFromByte',
    value: function binaryFromByte(byte) {
      var byteLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 8;

      var res = new Uint8Array(byteLength);
      for (var i = 0; i < res.length; i++) {
        var mask = Math.pow(2, i);
        var isOne = (byte & mask) > 0;
        res[res.length - 1 - i] = isOne;
      }
      return res;
    }
  }, {
    key: 'binaryToNumber',
    value: function binaryToNumber(bin) {
      var res = 0;
      for (var i = 0; i < bin.length; i++) {
        res += Math.pow(2, bin.length - i - 1) * bin[i];
      }
      return res;
    }
  }, {
    key: 'inputToBinary',
    value: function inputToBinary(input) {
      var inputByteLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 8;

      var res = new Uint8Array(input.length * inputByteLength);
      for (var i = 0; i < input.length; i++) {
        var bin = this.binaryFromByte(input[i], inputByteLength);
        res.set(bin, i * inputByteLength);
      }
      return res;
    }
  }, {
    key: 'binaryToUint8',
    value: function binaryToUint8(bin) {
      var result = new Uint8Array(Math.ceil(bin.length / 8));
      var index = 0;
      for (var i = 0; i < bin.length; i += 8) {
        var val = 0;
        for (var j = 0; j < 8 && i + j < bin.length; j++) {
          val = val + bin[i + j] * Math.pow(2, 8 - j - 1);
        }
        result[index] = val;
        index++;
      }
      return result;
    }
  }]);

  return LZW;
}();

// the actual decoder interface

var LZWDecoder = function (_AbstractDecoder) {
  _inherits(LZWDecoder, _AbstractDecoder);

  function LZWDecoder() {
    _classCallCheck(this, LZWDecoder);

    return _possibleConstructorReturn(this, (LZWDecoder.__proto__ || Object.getPrototypeOf(LZWDecoder)).apply(this, arguments));
  }

  _createClass(LZWDecoder, [{
    key: 'decodeBlock',
    value: function decodeBlock(buffer) {
      // decompressor = new LZW();
      return Promise.resolve(new LZW().decompress(buffer).buffer);
    }
  }]);

  return LZWDecoder;
}(_abstractdecoder2.default);

exports.default = LZWDecoder;

},{"../abstractdecoder.js":2}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _abstractdecoder = require('../abstractdecoder.js');

var _abstractdecoder2 = _interopRequireDefault(_abstractdecoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PackbitsDecoder = function (_AbstractDecoder) {
  _inherits(PackbitsDecoder, _AbstractDecoder);

  function PackbitsDecoder() {
    _classCallCheck(this, PackbitsDecoder);

    return _possibleConstructorReturn(this, (PackbitsDecoder.__proto__ || Object.getPrototypeOf(PackbitsDecoder)).apply(this, arguments));
  }

  _createClass(PackbitsDecoder, [{
    key: 'decodeBlock',
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
          for (var _j = 0; _j <= header; ++_j) {
            out.push(dataView.getUint8(i + _j + 1));
          }
          i += header + 1;
        }
      }
      return Promise.resolve(new Uint8Array(out).buffer);
    }
  }]);

  return PackbitsDecoder;
}(_abstractdecoder2.default);

exports.default = PackbitsDecoder;

},{"../abstractdecoder.js":2}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _abstractdecoder = require('../abstractdecoder.js');

var _abstractdecoder2 = _interopRequireDefault(_abstractdecoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RawDecoder = function (_AbstractDecoder) {
  _inherits(RawDecoder, _AbstractDecoder);

  function RawDecoder() {
    _classCallCheck(this, RawDecoder);

    return _possibleConstructorReturn(this, (RawDecoder.__proto__ || Object.getPrototypeOf(RawDecoder)).apply(this, arguments));
  }

  _createClass(RawDecoder, [{
    key: 'decodeBlock',
    value: function decodeBlock(buffer) {
      return Promise.resolve(buffer);
    }
  }]);

  return RawDecoder;
}(_abstractdecoder2.default);

exports.default = RawDecoder;

},{"../abstractdecoder.js":2}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataView64 = function () {
  function DataView64(arrayBuffer) {
    _classCallCheck(this, DataView64);

    this._dataView = new DataView(arrayBuffer);
  }

  _createClass(DataView64, [{
    key: "getUint64",
    value: function getUint64(offset, littleEndian) {
      var left = this.getUint32(offset, littleEndian);
      var right = this.getUint32(offset + 4, littleEndian);
      if (littleEndian) {
        return left << 32 | right;
      }
      return right << 32 | left;
    }
  }, {
    key: "getInt64",
    value: function getInt64(offset, littleEndian) {
      var left, right;
      if (littleEndian) {
        left = this.getInt32(offset, littleEndian);
        right = this.getUint32(offset + 4, littleEndian);

        return left << 32 | right;
      }
      left = this.getUint32(offset, littleEndian);
      right = this.getInt32(offset + 4, littleEndian);
      return right << 32 | left;
    }
  }, {
    key: "getUint8",
    value: function getUint8(offset, littleEndian) {
      return this._dataView.getUint8(offset, littleEndian);
    }
  }, {
    key: "getInt8",
    value: function getInt8(offset, littleEndian) {
      return this._dataView.getInt8(offset, littleEndian);
    }
  }, {
    key: "getUint16",
    value: function getUint16(offset, littleEndian) {
      return this._dataView.getUint16(offset, littleEndian);
    }
  }, {
    key: "getInt16",
    value: function getInt16(offset, littleEndian) {
      return this._dataView.getInt16(offset, littleEndian);
    }
  }, {
    key: "getUint32",
    value: function getUint32(offset, littleEndian) {
      return this._dataView.getUint32(offset, littleEndian);
    }
  }, {
    key: "getInt32",
    value: function getInt32(offset, littleEndian) {
      return this._dataView.getInt32(offset, littleEndian);
    }
  }, {
    key: "getFloat32",
    value: function getFloat32(offset, littleEndian) {
      return this._dataView.getFloat32(offset, littleEndian);
    }
  }, {
    key: "getFloat64",
    value: function getFloat64(offset, littleEndian) {
      return this._dataView.getFloat64(offset, littleEndian);
    }
  }, {
    key: "buffer",
    get: function get() {
      return this._dataView.buffer;
    }
  }]);

  return DataView64;
}();

exports.default = DataView64;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _globals = require('./globals.js');

var _geotiffimage = require('./geotiffimage.js');

var _geotiffimage2 = _interopRequireDefault(_geotiffimage);

var _dataview = require('./dataview64.js');

var _dataview2 = _interopRequireDefault(_dataview);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The abstraction for a whole GeoTIFF file.
 * @constructor
 * @param {ArrayBuffer} rawData the raw data stream of the file as an ArrayBuffer.
 * @param {Object} [options] further options.
 * @param {Boolean} [options.cache=false] whether or not decoded tiles shall be cached.
 */
var GeoTIFF = function () {
  function GeoTIFF(rawData, options) {
    _classCallCheck(this, GeoTIFF);

    this.dataView = new _dataview2.default(rawData);
    options = options || {};
    this.cache = options.cache || false;

    var BOM = this.dataView.getUint16(0, 0);
    if (BOM === 0x4949) {
      this.littleEndian = true;
    } else if (BOM === 0x4D4D) {
      this.littleEndian = false;
    } else {
      throw new TypeError('Invalid byte order value.');
    }

    var magicNumber = this.dataView.getUint16(2, this.littleEndian);
    if (this.dataView.getUint16(2, this.littleEndian) === 42) {
      this.bigTiff = false;
    } else if (magicNumber === 43) {
      this.bigTiff = true;
      var offsetBytesize = this.dataView.getUint16(4, this.littleEndian);
      if (offsetBytesize !== 8) {
        throw new Error('Unsupported offset byte-size.');
      }
    } else {
      throw new TypeError('Invalid magic number.');
    }

    this.fileDirectories = this.parseFileDirectories(this.getOffset(this.bigTiff ? 8 : 4));
  }

  _createClass(GeoTIFF, [{
    key: 'getOffset',
    value: function getOffset(offset) {
      if (this.bigTiff) {
        return this.dataView.getUint64(offset, this.littleEndian);
      }
      return this.dataView.getUint32(offset, this.littleEndian);
    }
  }, {
    key: 'getFieldTypeLength',
    value: function getFieldTypeLength(fieldType) {
      switch (fieldType) {
        case _globals.fieldTypes.BYTE:case _globals.fieldTypes.ASCII:case _globals.fieldTypes.SBYTE:case _globals.fieldTypes.UNDEFINED:
          return 1;
        case _globals.fieldTypes.SHORT:case _globals.fieldTypes.SSHORT:
          return 2;
        case _globals.fieldTypes.LONG:case _globals.fieldTypes.SLONG:case _globals.fieldTypes.FLOAT:
          return 4;
        case _globals.fieldTypes.RATIONAL:case _globals.fieldTypes.SRATIONAL:case _globals.fieldTypes.DOUBLE:
        case _globals.fieldTypes.LONG8:case _globals.fieldTypes.SLONG8:case _globals.fieldTypes.IFD8:
          return 8;
        default:
          throw new RangeError('Invalid field type: ' + fieldType);
      }
    }
  }, {
    key: 'getValues',
    value: function getValues(fieldType, count, offset) {
      var values = null;
      var readMethod = null;
      var fieldTypeLength = this.getFieldTypeLength(fieldType);

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
        case _globals.fieldTypes.LONG8:case _globals.fieldTypes.IFD8:
          values = new Array(count);readMethod = this.dataView.getUint64;
          break;
        case _globals.fieldTypes.SLONG8:
          values = new Array(count);readMethod = this.dataView.getInt64;
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
          throw new RangeError('Invalid field type: ' + fieldType);
      }

      // normal fields
      if (!(fieldType === _globals.fieldTypes.RATIONAL || fieldType === _globals.fieldTypes.SRATIONAL)) {
        for (var i = 0; i < count; ++i) {
          values[i] = readMethod.call(this.dataView, offset + i * fieldTypeLength, this.littleEndian);
        }
      }
      // RATIONAL or SRATIONAL
      else {
          for (var _i = 0; _i < count; _i += 2) {
            values[_i] = readMethod.call(this.dataView, offset + _i * fieldTypeLength, this.littleEndian);
            values[_i + 1] = readMethod.call(this.dataView, offset + (_i * fieldTypeLength + 4), this.littleEndian);
          }
        }

      if (fieldType === _globals.fieldTypes.ASCII) {
        return String.fromCharCode.apply(null, values);
      }
      return values;
    }
  }, {
    key: 'getFieldValues',
    value: function getFieldValues(fieldTag, fieldType, typeCount, valueOffset) {
      var fieldValues;
      var fieldTypeLength = this.getFieldTypeLength(fieldType);

      if (fieldTypeLength * typeCount <= (this.bigTiff ? 8 : 4)) {
        fieldValues = this.getValues(fieldType, typeCount, valueOffset);
      } else {
        var actualOffset = this.getOffset(valueOffset);
        fieldValues = this.getValues(fieldType, typeCount, actualOffset);
      }

      if (typeCount === 1 && _globals.arrayFields.indexOf(fieldTag) === -1 && !(fieldType === _globals.fieldTypes.RATIONAL || fieldType === _globals.fieldTypes.SRATIONAL)) {
        return fieldValues[0];
      }

      return fieldValues;
    }
  }, {
    key: 'parseGeoKeyDirectory',
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
          if (typeof value === 'undefined' || value === null) {
            throw new Error('Could not get value of geoKey \'' + key + '\'.');
          } else if (typeof value === 'string') {
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
    key: 'parseFileDirectories',
    value: function parseFileDirectories(byteOffset) {
      var nextIFDByteOffset = byteOffset;
      var fileDirectories = [];

      while (nextIFDByteOffset !== 0x00000000) {
        var numDirEntries = this.bigTiff ? this.dataView.getUint64(nextIFDByteOffset, this.littleEndian) : this.dataView.getUint16(nextIFDByteOffset, this.littleEndian);

        var fileDirectory = {};

        for (var i = byteOffset + (this.bigTiff ? 8 : 2), entryCount = 0; entryCount < numDirEntries; i += this.bigTiff ? 20 : 12, ++entryCount) {
          var fieldTag = this.dataView.getUint16(i, this.littleEndian);
          var fieldType = this.dataView.getUint16(i + 2, this.littleEndian);
          var typeCount = this.bigTiff ? this.dataView.getUint64(i + 4, this.littleEndian) : this.dataView.getUint32(i + 4, this.littleEndian);

          fileDirectory[_globals.fieldTagNames[fieldTag]] = this.getFieldValues(fieldTag, fieldType, typeCount, i + (this.bigTiff ? 12 : 8));
        }
        fileDirectories.push([fileDirectory, this.parseGeoKeyDirectory(fileDirectory)]);

        nextIFDByteOffset = this.getOffset(i);
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
    key: 'getImage',
    value: function getImage(index) {
      index = index || 0;
      var fileDirectoryAndGeoKey = this.fileDirectories[index];
      if (!fileDirectoryAndGeoKey) {
        throw new RangeError('Invalid image index');
      }
      return new _geotiffimage2.default(fileDirectoryAndGeoKey[0], fileDirectoryAndGeoKey[1], this.dataView, this.littleEndian, this.cache);
    }

    /**
     * Returns the count of the internal subfiles.
     *
     * @returns {Number} the number of internal subfile images
     */

  }, {
    key: 'getImageCount',
    value: function getImageCount() {
      return this.fileDirectories.length;
    }
  }]);

  return GeoTIFF;
}();

exports.default = GeoTIFF;

},{"./dataview64.js":8,"./geotiffimage.js":10,"./globals.js":11}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _globals = require('./globals.js');

var _rgb = require('./rgb.js');

var _pool = require('./pool.js');

var _pool2 = _interopRequireDefault(_pool);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function sum(array, start, end) {
  var s = 0;
  for (var i = start; i < end; ++i) {
    s += array[i];
  }
  return s;
}

function arrayForType(format, bitsPerSample, size) {
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
  throw Error('Unsupported data format/bitsPerSample');
}

/**
 * GeoTIFF sub-file image.
 * @constructor
 * @param {Object} fileDirectory The parsed file directory
 * @param {Object} geoKeys The parsed geo-keys
 * @param {DataView} dataView The DataView for the underlying file.
 * @param {Boolean} littleEndian Whether the file is encoded in little or big endian
 * @param {Boolean} cache Whether or not decoded tiles shall be cached
 */

var GeoTIFFImage = function () {
  function GeoTIFFImage(fileDirectory, geoKeys, dataView, littleEndian, cache) {
    _classCallCheck(this, GeoTIFFImage);

    this.fileDirectory = fileDirectory;
    this.geoKeys = geoKeys;
    this.dataView = dataView;
    this.littleEndian = littleEndian;
    this.tiles = cache ? {} : null;
    this.isTiled = fileDirectory.StripOffsets ? false : true;
    var planarConfiguration = fileDirectory.PlanarConfiguration;
    this.planarConfiguration = typeof planarConfiguration === 'undefined' ? 1 : planarConfiguration;
    if (this.planarConfiguration !== 1 && this.planarConfiguration !== 2) {
      throw new Error('Invalid planar configuration.');
    }
  }

  /**
   * Returns the associated parsed file directory.
   * @returns {Object} the parsed file directory
   */


  _createClass(GeoTIFFImage, [{
    key: 'getFileDirectory',
    value: function getFileDirectory() {
      return this.fileDirectory;
    }
    /**
    * Returns the associated parsed geo keys.
    * @returns {Object} the parsed geo keys
    */

  }, {
    key: 'getGeoKeys',
    value: function getGeoKeys() {
      return this.geoKeys;
    }
    /**
     * Returns the width of the image.
     * @returns {Number} the width of the image
     */

  }, {
    key: 'getWidth',
    value: function getWidth() {
      return this.fileDirectory.ImageWidth;
    }
    /**
     * Returns the height of the image.
     * @returns {Number} the height of the image
     */

  }, {
    key: 'getHeight',
    value: function getHeight() {
      return this.fileDirectory.ImageLength;
    }
    /**
     * Returns the number of samples per pixel.
     * @returns {Number} the number of samples per pixel
     */

  }, {
    key: 'getSamplesPerPixel',
    value: function getSamplesPerPixel() {
      return this.fileDirectory.SamplesPerPixel;
    }
    /**
     * Returns the width of each tile.
     * @returns {Number} the width of each tile
     */

  }, {
    key: 'getTileWidth',
    value: function getTileWidth() {
      return this.isTiled ? this.fileDirectory.TileWidth : this.getWidth();
    }
    /**
     * Returns the height of each tile.
     * @returns {Number} the height of each tile
     */

  }, {
    key: 'getTileHeight',
    value: function getTileHeight() {
      return this.isTiled ? this.fileDirectory.TileLength : this.fileDirectory.RowsPerStrip;
    }

    /**
     * Calculates the number of bytes for each pixel across all samples. Only full
     * bytes are supported, an exception is thrown when this is not the case.
     * @returns {Number} the bytes per pixel
     */

  }, {
    key: 'getBytesPerPixel',
    value: function getBytesPerPixel() {
      var bitsPerSample = 0;
      for (var i = 0; i < this.fileDirectory.BitsPerSample.length; ++i) {
        var bits = this.fileDirectory.BitsPerSample[i];
        if (bits % 8 !== 0) {
          throw new Error('Sample bit-width of ' + bits + ' is not supported.');
        } else if (bits !== this.fileDirectory.BitsPerSample[0]) {
          throw new Error('Differing size of samples in a pixel are not supported.');
        }
        bitsPerSample += bits;
      }
      return bitsPerSample / 8;
    }
  }, {
    key: 'getSampleByteSize',
    value: function getSampleByteSize(i) {
      if (i >= this.fileDirectory.BitsPerSample.length) {
        throw new RangeError('Sample index ' + i + ' is out of range.');
      }
      var bits = this.fileDirectory.BitsPerSample[i];
      if (bits % 8 !== 0) {
        throw new Error('Sample bit-width of ' + bits + ' is not supported.');
      }
      return bits / 8;
    }
  }, {
    key: 'getReaderForSample',
    value: function getReaderForSample(sampleIndex) {
      var format = this.fileDirectory.SampleFormat ? this.fileDirectory.SampleFormat[sampleIndex] : 1;
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
    key: 'getArrayForSample',
    value: function getArrayForSample(sampleIndex, size) {
      var format = this.fileDirectory.SampleFormat ? this.fileDirectory.SampleFormat[sampleIndex] : 1;
      var bitsPerSample = this.fileDirectory.BitsPerSample[sampleIndex];
      return arrayForType(format, bitsPerSample, size);
    }
  }, {
    key: 'getDecoder',
    value: function getDecoder() {
      return this.decoder;
    }

    /**
     * Returns the decoded strip or tile.
     * @param {Number} x the strip or tile x-offset
     * @param {Number} y the tile y-offset (0 for stripped images)
     * @param {Number} sample the sample to get for separated samples
     * @returns {Promise.<Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array>}
     */

  }, {
    key: 'getTileOrStrip',
    value: function getTileOrStrip(x, y, sample, pool) {
      var numTilesPerRow = Math.ceil(this.getWidth() / this.getTileWidth());
      var numTilesPerCol = Math.ceil(this.getHeight() / this.getTileHeight());
      var index = void 0;
      var tiles = this.tiles;
      if (this.planarConfiguration === 1) {
        index = y * numTilesPerRow + x;
      } else if (this.planarConfiguration === 2) {
        index = sample * numTilesPerRow * numTilesPerCol + y * numTilesPerRow + x;
      }

      var offset = void 0,
          byteCount = void 0;
      if (this.isTiled) {
        offset = this.fileDirectory.TileOffsets[index];
        byteCount = this.fileDirectory.TileByteCounts[index];
      } else {
        offset = this.fileDirectory.StripOffsets[index];
        byteCount = this.fileDirectory.StripByteCounts[index];
      }
      var slice = this.dataView.buffer.slice(offset, offset + byteCount);

      var promise = void 0;
      if (tiles === null) {
        // promise = this.getDecoder().decodeBlock(slice);
        promise = pool.decodeBlock(slice);
        // promise = this.pool.decodeBlock(offset, byteCount);
      } else {
        if (!tiles[index]) {
          // tiles[index] = promise = this.getDecoder().decodeBlock(slice);
          tiles[index] = promise = pool.decodeBlock(slice);
          // tiles[index] = promise = this.pool.decodeBlock(offset, byteCount);
        }
      }

      return promise.then(function (data) {
        return {
          x: x,
          y: y,
          sample: sample,
          data: data
        };
      });
    }
  }, {
    key: '_readRaster',
    value: function _readRaster(imageWindow, samples, valueArrays, interleave, pool) {
      var _this = this;

      var tileWidth = this.getTileWidth();
      var tileHeight = this.getTileHeight();

      var minXTile = Math.floor(imageWindow[0] / tileWidth);
      var maxXTile = Math.ceil(imageWindow[2] / tileWidth);
      var minYTile = Math.floor(imageWindow[1] / tileHeight);
      var maxYTile = Math.ceil(imageWindow[3] / tileHeight);

      var windowWidth = imageWindow[2] - imageWindow[0];
      // const windowHeight = imageWindow[3] - imageWindow[1];

      var bytesPerPixel = this.getBytesPerPixel();

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

      var promises = [];
      var littleEndian = this.littleEndian;

      for (var yTile = minYTile; yTile < maxYTile; ++yTile) {
        for (var xTile = minXTile; xTile < maxXTile; ++xTile) {
          var _loop = function _loop(sampleIndex) {
            var _sampleIndex = sampleIndex;
            var sample = samples[_sampleIndex];
            if (_this.planarConfiguration === 2) {
              bytesPerPixel = _this.getSampleByteSize(sample);
            }
            var promise = _this.getTileOrStrip(xTile, yTile, sample, pool);
            promises.push(promise);
            promise.then(function (tile) {
              var dataView = new DataView(tile.data);
              var firstLine = tile.y * tileHeight;
              var firstCol = tile.x * tileWidth;
              var lastLine = (tile.y + 1) * tileHeight;
              var lastCol = (tile.x + 1) * tileWidth;
              var reader = sampleReaders[_sampleIndex];

              var ymax = Math.min(tileHeight, tileHeight - (lastLine - imageWindow[3]));
              var xmax = Math.min(tileWidth, tileWidth - (lastCol - imageWindow[2]));

              for (var y = Math.max(0, imageWindow[1] - firstLine); y < ymax; ++y) {
                for (var x = Math.max(0, imageWindow[0] - firstCol); x < xmax; ++x) {
                  var pixelOffset = (y * tileWidth + x) * bytesPerPixel;
                  var value = reader.call(dataView, pixelOffset + srcSampleOffsets[_sampleIndex], littleEndian);
                  var windowCoordinate = void 0;
                  if (interleave) {
                    windowCoordinate = (y + firstLine - imageWindow[1]) * windowWidth * samples.length + (x + firstCol - imageWindow[0]) * samples.length + _sampleIndex;
                    valueArrays[windowCoordinate] = value;
                  } else {
                    windowCoordinate = (y + firstLine - imageWindow[1]) * windowWidth + x + firstCol - imageWindow[0];
                    valueArrays[_sampleIndex][windowCoordinate] = value;
                  }
                }
              }
            });
          };

          for (var sampleIndex = 0; sampleIndex < samples.length; ++sampleIndex) {
            _loop(sampleIndex);
          }
        }
      }
      return Promise.all(promises).then(function () {
        return valueArrays;
      });
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
     * @returns {Promise.<(TypedArray|TypedArray[])>} the decoded arrays as a promise
     */

  }, {
    key: 'readRasters',
    value: function readRasters(_ref) {
      var wnd = _ref.window,
          samples = _ref.samples,
          interleave = _ref.interleave,
          _ref$poolSize = _ref.poolSize,
          poolSize = _ref$poolSize === undefined ? null : _ref$poolSize;


      var imageWindow = wnd || [0, 0, this.getWidth(), this.getHeight()];

      var pool = new _pool2.default(this.fileDirectory.Compression, poolSize);

      // check parameters
      if (imageWindow[0] < 0 || imageWindow[1] < 0 || imageWindow[2] > this.getWidth() || imageWindow[3] > this.getHeight()) {
        return Promise.reject(new Error('Select window is out of image bounds.'));
      } else if (imageWindow[0] > imageWindow[2] || imageWindow[1] > imageWindow[3]) {
        return Promise.reject(new Error('Invalid subsets'));
      }

      var imageWindowWidth = imageWindow[2] - imageWindow[0];
      var imageWindowHeight = imageWindow[3] - imageWindow[1];
      var numPixels = imageWindowWidth * imageWindowHeight;

      if (!samples) {
        samples = [];
        for (var i = 0; i < this.fileDirectory.SamplesPerPixel; ++i) {
          samples.push(i);
        }
      } else {
        for (var _i = 0; _i < samples.length; ++_i) {
          if (samples[_i] >= this.fileDirectory.SamplesPerPixel) {
            return Promise.reject(new RangeError('Invalid sample index \'' + samples[_i] + '\'.'));
          }
        }
      }
      var valueArrays = void 0;
      if (interleave) {
        var format = this.fileDirectory.SampleFormat ? Math.max.apply(null, this.fileDirectory.SampleFormat) : 1;
        var bitsPerSample = Math.max.apply(null, this.fileDirectory.BitsPerSample);
        valueArrays = arrayForType(format, bitsPerSample, numPixels * samples.length);
      } else {
        valueArrays = [];
        for (var _i2 = 0; _i2 < samples.length; ++_i2) {
          valueArrays.push(this.getArrayForSample(samples[_i2], numPixels));
        }
      }

      return this._readRaster(imageWindow, samples, valueArrays, interleave, pool).then(function (result) {
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
     * @returns {Promise.<TypedArray|TypedArray[]>} the RGB array as a Promise
     */

  }, {
    key: 'readRGB',
    value: function readRGB(_ref2) {
      var window = _ref2.window,
          poolSize = _ref2.poolSize;

      var imageWindow = window || [0, 0, this.getWidth(), this.getHeight()];

      // check parameters
      if (imageWindow[0] < 0 || imageWindow[1] < 0 || imageWindow[2] > this.getWidth() || imageWindow[3] > this.getHeight()) {
        throw new Error('Select window is out of image bounds.');
      } else if (imageWindow[0] > imageWindow[2] || imageWindow[1] > imageWindow[3]) {
        throw new Error('Invalid subsets');
      }

      var width = imageWindow[2] - imageWindow[0];
      var height = imageWindow[3] - imageWindow[1];

      var pi = this.fileDirectory.PhotometricInterpretation;

      var bits = this.fileDirectory.BitsPerSample[0];
      var max = Math.pow(2, bits);

      if (pi === _globals.photometricInterpretations.RGB) {
        return this.readRasters({
          window: window,
          interleave: true,
          poolSize: poolSize
        });
      }

      var samples = void 0;
      switch (pi) {
        case _globals.photometricInterpretations.WhiteIsZero:
        case _globals.photometricInterpretations.BlackIsZero:
        case _globals.photometricInterpretations.Palette:
          samples = [0];
          break;
        case _globals.photometricInterpretations.CMYK:
          samples = [0, 1, 2, 3];
          break;
        case _globals.photometricInterpretations.YCbCr:
        case _globals.photometricInterpretations.CIELab:
          samples = [0, 1, 2];
          break;
        default:
          throw new Error('Invalid or unsupported photometric interpretation.');
      }

      var subOptions = {
        window: imageWindow,
        interleave: true,
        samples: samples,
        poolSize: poolSize
      };
      var fileDirectory = this.fileDirectory;
      return this.readRasters(subOptions).then(function (raster) {
        switch (pi) {
          case _globals.photometricInterpretations.WhiteIsZero:
            return (0, _rgb.fromWhiteIsZero)(raster, max, width, height);
          case _globals.photometricInterpretations.BlackIsZero:
            return (0, _rgb.fromBlackIsZero)(raster, max, width, height);
          case _globals.photometricInterpretations.Palette:
            return (0, _rgb.fromPalette)(raster, fileDirectory.ColorMap, width, height);
          case _globals.photometricInterpretations.CMYK:
            return (0, _rgb.fromCMYK)(raster, width, height);
          case _globals.photometricInterpretations.YCbCr:
            return (0, _rgb.fromYCbCr)(raster, width, height);
          case _globals.photometricInterpretations.CIELab:
            return (0, _rgb.fromCIELab)(raster, width, height);
        }
      });
    }

    /**
     * Returns an array of tiepoints.
     * @returns {Object[]}
     */

  }, {
    key: 'getTiePoints',
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
    key: 'getGDALMetadata',
    value: function getGDALMetadata() {
      var metadata = {};
      if (!this.fileDirectory.GDAL_METADATA) {
        return null;
      }
      var string = this.fileDirectory.GDAL_METADATA;
      var xmlDom = (0, _globals.parseXml)(string.substring(0, string.length - 1));
      var result = xmlDom.evaluate('GDALMetadata/Item', xmlDom, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
      for (var i = 0; i < result.snapshotLength; ++i) {
        var node = result.snapshotItem(i);
        metadata[node.getAttribute('name')] = node.textContent;
      }
      return metadata;
    }
  }]);

  return GeoTIFFImage;
}();

exports.default = GeoTIFFImage;

},{"./globals.js":11,"./pool.js":13,"./rgb.js":14}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var fieldTagNames = exports.fieldTagNames = {
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
var fieldTags = exports.fieldTags = {};
for (key in fieldTagNames) {
  fieldTags[fieldTagNames[key]] = parseInt(key);
}

var arrayFields = exports.arrayFields = [fieldTags.BitsPerSample, fieldTags.ExtraSamples, fieldTags.SampleFormat, fieldTags.StripByteCounts, fieldTags.StripOffsets, fieldTags.StripRowCounts, fieldTags.TileByteCounts, fieldTags.TileOffsets];

var fieldTypeNames = exports.fieldTypeNames = {
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
  0x000C: 'DOUBLE',
  // introduced by BigTIFF
  0x0010: 'LONG8',
  0x0011: 'SLONG8',
  0x0012: 'IFD8'
};

var fieldTypes = exports.fieldTypes = {};
for (key in fieldTypeNames) {
  fieldTypes[fieldTypeNames[key]] = parseInt(key);
}

var photometricInterpretations = exports.photometricInterpretations = {
  WhiteIsZero: 0,
  BlackIsZero: 1,
  RGB: 2,
  Palette: 3,
  TransparencyMask: 4,
  CMYK: 5,
  YCbCr: 6,

  CIELab: 8,
  ICCLab: 9
};

var geoKeyNames = exports.geoKeyNames = {
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

var geoKeys = exports.geoKeys = {};
for (key in geoKeyNames) {
  geoKeys[geoKeyNames[key]] = parseInt(key);
}

var parseXml = exports.parseXml = void 0;
// node.js version
if (typeof window === 'undefined') {
  exports.parseXml = parseXml = function parseXml(xmlStr) {
    // requires xmldom module
    var DOMParser = require('xmldom').DOMParser;
    return new DOMParser().parseFromString(xmlStr, 'text/xml');
  };
} else if (typeof window.DOMParser !== 'undefined') {
  exports.parseXml = parseXml = function parseXml(xmlStr) {
    return new window.DOMParser().parseFromString(xmlStr, 'text/xml');
  };
} else if (typeof window.ActiveXObject !== 'undefined' && new window.ActiveXObject('Microsoft.XMLDOM')) {
  exports.parseXml = parseXml = function parseXml(xmlStr) {
    var xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
    xmlDoc.async = 'false';
    xmlDoc.loadXML(xmlStr);
    return xmlDoc;
  };
}

},{"xmldom":"xmldom"}],12:[function(require,module,exports){
'use strict';

var _geotiff = require('./geotiff.js');

var _geotiff2 = _interopRequireDefault(_geotiff);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Main parsing function for GeoTIFF files.
 * @param {(string|ArrayBuffer)} data Raw data to parse the GeoTIFF from.
 * @param {Object} [options] further options.
 * @param {Boolean} [options.cache=false] whether or not decoded tiles shall be cached.
 * @returns {GeoTIFF} the parsed geotiff file.
 */
var parse = function parse(data, options) {
  var rawData, i, strLen, view;
  if (typeof data === 'string' || data instanceof String) {
    rawData = new ArrayBuffer(data.length * 2); // 2 bytes for each char
    view = new Uint16Array(rawData);
    for (i = 0, strLen = data.length; i < strLen; ++i) {
      view[i] = data.charCodeAt(i);
    }
  } else if (data instanceof ArrayBuffer) {
    rawData = data;
  } else {
    throw new Error('Invalid input data given.');
  }
  return new _geotiff2.default(rawData, options);
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.parse = parse;
}
if (typeof window !== 'undefined') {
  window['GeoTIFF'] = { parse: parse };
}

},{"./geotiff.js":9}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webworkify = require('webworkify');

var _webworkify2 = _interopRequireDefault(_webworkify);

var _worker = require('./worker.js');

var _worker2 = _interopRequireDefault(_worker);

var _compression = require('./compression');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultPoolSize = navigator.hardwareConcurrency;

var Pool = function () {
  function Pool(compression) {
    var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultPoolSize;

    _classCallCheck(this, Pool);

    this.compression = compression;
    this.workers = [];
    this.decoder = null;

    for (var i = 0; i < size; ++i) {
      var w = (0, _webworkify2.default)(_worker2.default);
      this.workers.push(w);
    }

    if (size === null || size < 1) {
      this.decoder = (0, _compression.getDecoder)(compression);
    }
  }

  _createClass(Pool, [{
    key: 'decodeBlock',
    value: function decodeBlock(buffer) {
      var _this = this;

      if (this.decoder) {
        return this.decoder.decodeBlock(buffer);
      }
      return this.waitForWorker().then(function (currentWorker) {
        return new Promise(function (resolve, reject) {
          currentWorker.onmessage = function (event) {
            _this.workers.push(currentWorker);
            resolve(event.data[0]);
          };
          currentWorker.onerror = function (error) {
            _this.workers.push(currentWorker);
            reject(error);
          };
          currentWorker.postMessage(['decode', _this.compression, buffer], [buffer]);
        });
      });
    }
  }, {
    key: 'waitForWorker',
    value: function waitForWorker() {
      var _this2 = this;

      var sleepTime = 10;
      var waiter = function waiter(callback) {
        if (_this2.workers.length) {
          callback(_this2.workers.pop());
        } else {
          setTimeout(waiter, sleepTime, callback);
        }
      };

      return new Promise(function (resolve) {
        waiter(resolve);
      });
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      for (var i = 0; i < this.workers.length; ++i) {
        this.workers[i].terminate();
      }
    }
  }]);

  return Pool;
}();

exports.default = Pool;

},{"./compression":4,"./worker.js":15,"webworkify":1}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromWhiteIsZero = fromWhiteIsZero;
exports.fromBlackIsZero = fromBlackIsZero;
exports.fromPalette = fromPalette;
exports.fromCMYK = fromCMYK;
exports.fromYCbCr = fromYCbCr;
exports.fromCIELab = fromCIELab;
function fromWhiteIsZero(raster, max, width, height) {
  var rgbRaster = new Uint8Array(width * height * 3);
  var value = void 0;
  for (var i = 0, j = 0; i < raster.length; ++i, j += 3) {
    value = 256 - raster[i] / max * 256;
    rgbRaster[j] = value;
    rgbRaster[j + 1] = value;
    rgbRaster[j + 2] = value;
  }
  return rgbRaster;
}

function fromBlackIsZero(raster, max, width, height) {
  var rgbRaster = new Uint8Array(width * height * 3);
  var value = void 0;
  for (var i = 0, j = 0; i < raster.length; ++i, j += 3) {
    value = raster[i] / max * 256;
    rgbRaster[j] = value;
    rgbRaster[j + 1] = value;
    rgbRaster[j + 2] = value;
  }
  return rgbRaster;
}

function fromPalette(raster, colorMap, width, height) {
  var rgbRaster = new Uint8Array(width * height * 3);
  var greenOffset = colorMap.length / 3;
  var blueOffset = colorMap.length / 3 * 2;
  for (var i = 0, j = 0; i < raster.length; ++i, j += 3) {
    var mapIndex = raster[i];
    rgbRaster[j] = colorMap[mapIndex] / 65536 * 256;
    rgbRaster[j + 1] = colorMap[mapIndex + greenOffset] / 65536 * 256;
    rgbRaster[j + 2] = colorMap[mapIndex + blueOffset] / 65536 * 256;
  }
  return rgbRaster;
}

function fromCMYK(cmykRaster, width, height) {
  var rgbRaster = new Uint8Array(width * height * 3);
  var c = void 0,
      m = void 0,
      y = void 0,
      k = void 0;
  for (var i = 0, j = 0; i < cmykRaster.length; i += 4, j += 3) {
    c = cmykRaster[i];
    m = cmykRaster[i + 1];
    y = cmykRaster[i + 2];
    k = cmykRaster[i + 3];

    rgbRaster[j] = 255 * ((255 - c) / 256) * ((255 - k) / 256);
    rgbRaster[j + 1] = 255 * ((255 - m) / 256) * ((255 - k) / 256);
    rgbRaster[j + 2] = 255 * ((255 - y) / 256) * ((255 - k) / 256);
  }
  return rgbRaster;
}

function fromYCbCr(yCbCrRaster, width, height) {
  var rgbRaster = new Uint8Array(width * height * 3);
  var y = void 0,
      cb = void 0,
      cr = void 0;
  for (var i = 0, j = 0; i < yCbCrRaster.length; i += 3, j += 3) {
    y = yCbCrRaster[i];
    cb = yCbCrRaster[i + 1];
    cr = yCbCrRaster[i + 2];

    rgbRaster[j] = y + 1.40200 * (cr - 0x80);
    rgbRaster[j + 1] = y - 0.34414 * (cb - 0x80) - 0.71414 * (cr - 0x80);
    rgbRaster[j + 2] = y + 1.77200 * (cb - 0x80);
  }
  return rgbRaster;
}

// converted from here:
// http://de.mathworks.com/matlabcentral/fileexchange/24010-lab2rgb/content/Lab2RGB.m
// still buggy
function fromCIELab(cieLabRaster, width, height) {
  var T1 = 0.008856;
  var T2 = 0.206893;
  var MAT = [3.240479, -1.537150, -0.498535, -0.969256, 1.875992, 0.041556, 0.055648, -0.204043, 1.057311];
  var rgbRaster = new Uint8Array(width * height * 3);
  var L = void 0,
      a = void 0,
      b = void 0;
  var fX = void 0,
      fY = void 0,
      fZ = void 0,
      XT = void 0,
      YT = void 0,
      ZT = void 0,
      X = void 0,
      Y = void 0,
      Z = void 0;
  for (var i = 0, j = 0; i < cieLabRaster.length; i += 3, j += 3) {
    L = cieLabRaster[i];
    a = cieLabRaster[i + 1];
    b = cieLabRaster[i + 2];

    // Compute Y
    fY = Math.pow((L + 16) / 116, 3);
    YT = fY > T1;
    fY = (YT !== 0) * (L / 903.3) + YT * fY;
    Y = fY;

    fY = YT * Math.pow(fY, 1 / 3) + (YT !== 0) * (7.787 * fY + 16 / 116);

    // Compute X
    fX = a / 500 + fY;
    XT = fX > T2;
    X = XT * Math.pow(fX, 3) + (XT !== 0) * ((fX - 16 / 116) / 7.787);

    // Compute Z
    fZ = fY - b / 200;
    ZT = fZ > T2;
    Z = ZT * Math.pow(fZ, 3) + (ZT !== 0) * ((fZ - 16 / 116) / 7.787);

    // Normalize for D65 white point
    X = X * 0.950456;
    Z = Z * 1.088754;

    rgbRaster[j] = X * MAT[0] + Y * MAT[1] + Z * MAT[2];
    rgbRaster[j + 1] = X * MAT[3] + Y * MAT[4] + Z * MAT[5];
    rgbRaster[j + 2] = X * MAT[6] + Y * MAT[7] + Z * MAT[8];
  }
  return rgbRaster;
}

},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (self) {
  self.addEventListener('message', function (event) {
    var _event$data = _toArray(event.data),
        name = _event$data[0],
        args = _event$data.slice(1);

    switch (name) {
      case 'decode':
        decode.apply(undefined, [self].concat(_toConsumableArray(args)));
        break;
    }
  });
};

var _compression = require('./compression');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function decode(self, compression, buffer) {
  var decoder = (0, _compression.getDecoder)(compression);
  decoder.decodeBlock(buffer).then(function (result) {
    self.postMessage([result], [result]);
  });
}

},{"./compression":4}]},{},[12]);
