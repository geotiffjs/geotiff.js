"use strict";

//var lzwCompress = require("lzwcompress");
var AbstractDecoder = require("../abstractdecoder.js");

var MIN_BITS = 9;
var MAX_BITS = 12;
var CLEAR_CODE = 256; // clear code
var EOI_CODE = 257; // end of information

function getByte(array, position, length) {
  var d = position % 8;
  var a = Math.floor(position/8);
  var de = 8-d;
  var ef = (position + length) - ((a+1)*8);
  var fg = 8*(a+2) - (position+length);
  var dg = (a+2)*8 - position;
  fg = Math.max(0, fg);
  if (a >= array.length) {
    console.warn('ran off the end of the buffer before finding EOI_CODE (end on input code)');
    return EOI_CODE;
  }
  var chunk1 = array[a] & (Math.pow(2, 8-d) - 1);
  chunk1 = chunk1 << (length - de);
  var chunks = chunk1;
  if (a+1 < array.length) {
    var chunk2 = array[a+1] >>> fg;
    chunk2 = chunk2 << Math.max(0, (length - dg));
    chunks += chunk2;
  }
  if (ef > 8 && a+2 < array.length) {
    var hi = (a+3)*8 - (position+length);
    var chunk3 = array[a+2] >>> hi;
    chunks += chunk3;
  }
  return chunks;
}

function appendReversed(dest, source) {
  for (let i = source.length - 1; i >= 0; i--) {
    dest.push(source[i]);
  }
  return dest;
}

function decompress(input) {
  let dictionary_index = new Uint16Array(4093);
  let dictionary_char = new Uint8Array(4093);
  for (var i=0; i <= 257; i++) {
    dictionary_index[i] = 4096;
    dictionary_char[i] = i;
  }
  let dictionary_length = 258;
  let byteLength = MIN_BITS;
  let position = 0;

  function initDictionary() {
    dictionary_length = 258;
    byteLength = MIN_BITS;
  }
  function getNext(array) {
    var byte = getByte(array, position, byteLength);
    position += byteLength;
    return byte;
  }
  function addToDictionary(i, c) {
    dictionary_char[dictionary_length] = c;
    dictionary_index[dictionary_length] = i;
    dictionary_length++;
    if (dictionary_length >= Math.pow(2, byteLength)) {
      byteLength++;
    }
    return dictionary_length - 1;
  }
  function get_dictionary_reversed(n) {
    const rev = [];
    while (n !== 4096) {
      rev.push(dictionary_char[n]);
      n = dictionary_index[n];
    }
    return rev;
  }

  const result = [];
  initDictionary();
  var array = new Uint8Array(input);
  var code = getNext(array);
  var oldCode;
  while (code !== EOI_CODE) {
    if (code === CLEAR_CODE) {
      initDictionary();
      code = getNext(array);
      while (code === CLEAR_CODE) {
        code = getNext(array);
      }
      if (code > CLEAR_CODE) {
        throw('corrupted code at scanline ' + code);
      }
      if (code === EOI_CODE) {
        break;
      } else {
        let val = get_dictionary_reversed(code);
        appendReversed(result, val);
        oldCode = code;
      }
    } else {
      if (code < dictionary_length) {
        let val = get_dictionary_reversed(code);
        appendReversed(result, val);
        addToDictionary(oldCode, val[val.length-1]);
        oldCode = code;
      } else {
        let oldVal = get_dictionary_reversed(oldCode);
        if (!oldVal) {
          throw(`Bogus entry. Not in dictionary, ${oldCode} / ${dictionary_length}, position: ${position}`);
        }
        appendReversed(result, oldVal);
        result.push(oldVal[oldVal.length-1]);
        addToDictionary(oldCode, oldVal[oldVal.length-1]);
        oldCode = code;
      }
    }
    if (dictionary_length >= Math.pow(2, byteLength) - 1) {
      byteLength ++;
    }
    code = getNext(array);
  }
  return new Uint8Array(result);
}

function LZWDecoder() {}

LZWDecoder.prototype = Object.create(AbstractDecoder.prototype);
LZWDecoder.prototype.constructor = LZWDecoder;
LZWDecoder.prototype.decodeBlock = function(buffer) {
  return decompress(buffer, false).buffer;
};

module.exports = LZWDecoder;
