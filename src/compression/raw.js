"use strict";

var AbstractDecoder = require("../abstractdecoder.js");

function RawDecoder() { }

RawDecoder.prototype = Object.create(AbstractDecoder.prototype);
RawDecoder.prototype.constructor = RawDecoder;
RawDecoder.prototype.decodeBlock = function(buffer) {
  return buffer;
};

module.exports = RawDecoder;