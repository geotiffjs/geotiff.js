"use strict";

//var lzwCompress = require("lzwcompress");
var AbstractDecoder = require("../abstractdecoder.js");

function LZWDecoder() { }

LZWDecoder.prototype = Object.create(AbstractDecoder.prototype);
LZWDecoder.prototype.constructor = LZWDecoder;
LZWDecoder.prototype.decodeBlock = function(buffer) {
  throw new Error("LZWDecoder is not yet implemented");
  //return lzwCompress.unpack(Array.prototype.slice.call(new Uint8Array(buffer)));
};

module.exports = LZWDecoder;
