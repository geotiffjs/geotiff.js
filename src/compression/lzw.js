"use strict";

//var lzwCompress = require("lzwcompress");
var AbstractDecoder = require("../abstractdecoder.js");
var LZW = require("./LZWuncompress.js");

var compressor = new window.LZWuncompress();

function LZWDecoder() { }

LZWDecoder.prototype = Object.create(AbstractDecoder.prototype);
LZWDecoder.prototype.constructor = LZWDecoder;
LZWDecoder.prototype.decodeBlock = function(buffer) {
  var fk = new Uint8Array(buffer);
  var gu = compressor.decompress(fk);
  return gu.buffer;
};

module.exports = LZWDecoder;
