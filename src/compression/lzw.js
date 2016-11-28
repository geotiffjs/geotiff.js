"use strict";

//var lzwCompress = require("lzwcompress");
var AbstractDecoder = require("../abstractdecoder.js");

var MIN_BITS = 9;
var MAX_BITS = 12;
var CLEAR_CODE = 256; // clear code
var EOI_CODE = 257; // end of information

function LZW() {
  this.littleEndian = false;
  this.position = 0;

  this._makeEntryLookup = false;
  this.dictionary = [];
}

LZW.prototype = {
  constructor: LZW,
  initDictionary: function() {
    this.dictionary = new Array(258);
    this.entryLookup = {};
    this.byteLength = MIN_BITS;
    for (var i=0; i <= 257; i++) {
      this.dictionary[i] = [i];
      if (this._makeEntryLookup) {
        this.entryLookup[i] = i;
      }
    }
  },

  decompress: function(input) {
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
          throw('corrupted code at scanline ' + code);
        }
        if (code === EOI_CODE) {
          break;
        } else {
          let val = this.dictionary[code];
          this.appendArray(this.result, val);
          oldCode = code;
        }
      } else {
        if (this.dictionary[code] !== undefined) {
          let val = this.dictionary[code];
          this.appendArray(this.result, val);
          if (!this.dictionary[oldCode]) {
            console.warn('fail', oldCode);
          }
          let newVal = this.dictionary[oldCode].concat(this.dictionary[code][0]);
          this.addToDictionary(newVal);
          oldCode = code;
        } else {
          let oldVal = this.dictionary[oldCode];
          if (!oldVal) {
            throw(`Bogus entry. Not in dictionary, ${oldCode} / ${this.dictionary.length}, position: ${this.position}`);
          }
          let newVal = oldVal.concat(this.dictionary[oldCode][0]);
          this.appendArray(this.result, newVal);
          this.addToDictionary(newVal);
          oldCode = code;
        }
      }
      if (this.dictionary.length >= Math.pow(2, this.byteLength) - 1) {
        this.byteLength ++;
      }
      code = this.getNext(mydataview);
    }
    return new Uint8Array(this.result);
  },

  appendArray: function (dest, source) {
    for (var i =0; i<source.length; i++) {
      dest.push(source[i]);
    }
    return dest;
  },

  haveBytesChanged: function () {
    if (this.dictionary.length >= Math.pow(2, this.byteLength) ) {
      this.byteLength ++;
      return true;
    }
    return false;
  },

  addToDictionary: function (arr) {
    this.dictionary.push(arr);
    if (this._makeEntryLookup) {
      this.entryLookup[arr] = this.dictionary.length - 1;
    }
    this.haveBytesChanged();
    return this.dictionary.length - 1;
  },

  getNext: function (dataview) {
    var byte = this.getByte(dataview, this.position, this.byteLength);
    this.position += this.byteLength;
    return byte;
  },

  // This binary representation might actually be as fast as the completely illegible bit shift approach
  //
  getByte: function (dataview, position, length) {
    var d = position % 8;
    var a = Math.floor(position/8);
    var de = 8-d;
    var ef = (position + length) - ((a+1)*8);
    var fg = 8*(a+2) - (position+length);
    var dg = (a+2)*8 - position;
    fg = Math.max(0, fg);
    if (a >= dataview.byteLength) {
      console.warn('ran off the end of the buffer before finding EOI_CODE (end on input code)');
      return EOI_CODE;
    }
    var chunk1 = dataview.getUint8(a,this.littleEndian) & (Math.pow(2, 8-d) - 1);
    chunk1 = chunk1 << (length - de);
    var chunks = chunk1;
    if (a+1 < dataview.byteLength) {
      var chunk2 = dataview.getUint8(a+1,this.littleEndian) >>> fg;
      chunk2 = chunk2 << Math.max(0, (length - dg));
      chunks += chunk2;
    }
    if (ef > 8 && a+2 < dataview.byteLength) {
      var hi = (a+3)*8 - (position+length);
      var chunk3 = dataview.getUint8(a+2,this.littleEndian) >>> hi;
      chunks += chunk3;
    }
    return chunks;
  },

// compress has not been optimized and uses a uint8 array to hold binary values.
  compress: function (input) {
    this._makeEntryLookup = true;
    this.initDictionary();
    this.position = 0;
    var resultBits = [];
    var omega = [];
    resultBits = this.appendArray(resultBits, this.binaryFromByte(CLEAR_CODE, this.byteLength)); // resultBits.concat(Array.from(this.binaryFromByte(this.CLEAR_CODE, this.byteLength)))
    for (var i=0; i<input.length; i++) {
      var k = [input[i]];
      var omk = omega.concat(k);
      if (this.entryLookup[omk] !== undefined) {
        omega = omk;
      } else {
        let code = this.entryLookup[omega];
        let bin = this.binaryFromByte(code, this.byteLength);
        resultBits = this.appendArray(resultBits, bin);
        this.addToDictionary(omk);
        omega = k;
        if (this.dictionary.length >= Math.pow(2, MAX_BITS) ) {
          resultBits = this.appendArray(resultBits, this.binaryFromByte(CLEAR_CODE, this.byteLength));
          this.initDictionary();
        }
      }
    }
    let code = this.entryLookup[omega];
    let bin = this.binaryFromByte(code, this.byteLength);
    resultBits = this.appendArray(resultBits, bin);
    resultBits = resultBits = this.appendArray(resultBits, this.binaryFromByte(EOI_CODE, this.byteLength));
    this.binary = resultBits;
    this.result = this.binaryToUint8(resultBits);
    return this.result;
  },

  byteFromCode: function (code) {
    var res = this.dictionary[code];
    return res;
  },

  binaryFromByte: function (byte, byteLength=8) {
    var res = new Uint8Array(byteLength);
    for (var i=0; i<res.length; i++) {
      var mask = Math.pow(2,i);
      var isOne = (byte & mask) > 0;
      res[res.length - 1 - i] = isOne;
    }
    return res;
  },

  binaryToNumber: function (bin) {
    var res = 0;
    for (var i=0; i<bin.length; i++) {
      res += Math.pow(2, bin.length - i - 1) * bin[i];
    }
    return res;
  },

  inputToBinary: function (input, inputByteLength=8) {
    var res = new Uint8Array(input.length * inputByteLength);
    for (var i=0; i<input.length; i++) {
      var bin = this.binaryFromByte(input[i], inputByteLength);
      res.set(bin, i * inputByteLength);
    }
    return res;
  },

  binaryToUint8: function (bin) {
    var result = new Uint8Array(Math.ceil(bin.length/8));
    var index = 0;
    for (var i=0; i<bin.length; i+=8) {
      var val = 0;
      for (var j=0; j<8 && i+j<bin.length; j++) {
        val = val + bin[i+j] * Math.pow(2, 8-j-1);
      }
      result[index] = val;
      index ++;
    }
    return result;
  }

};

// the actual decoder interface

function LZWDecoder() {
  this.decompressor = new LZW();
}

LZWDecoder.prototype = Object.create(AbstractDecoder.prototype);
LZWDecoder.prototype.constructor = LZWDecoder;
LZWDecoder.prototype.decodeBlock = function(buffer) {
  return this.decompressor.decompress(buffer).buffer;
};
/**
* Convert from predictor raster (where every value is the diffrence between it and the one to it's left) to normal raster
* It says that it only makes sense with LZW compressions but could be used with other compressions too.
**/
LZWDecoder.prototype.fromPredictorType2 = function(raster, width, height, channels=1) {
  var rasterOut = new raster.constructor(width * height * channels);
  rasterOut.set(raster); // copy
  for (var y = 0; y < height; y++) {
    for (var x = 1; x < width; x++) {
       for (var chan = 0; chan < channels; chan++) {
          var idxPrev = channels * (width * y + x - 1) + chan;
          var idx = channels * (width * y + x) + chan;
          var prev = rasterOut[idxPrev];
          var curr = rasterOut[idx];
          var val = prev + curr;
          rasterOut[idx] = val;
       }
    }
  }
  return rasterOut;
};

module.exports = LZWDecoder;
