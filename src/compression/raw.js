var AbstractDecoder = require("../abstractdecoder.js");


var RawDecoder = function() {}

RawDecoder.prototype = Object.create(AbstractDecoder.prototype);

RawDecoder.prototype.decodeBlock = function(buffer) {
  return buffer;
}

RawDecoder.prototype.constructor = RawDecoder;


module.exports = RawDecoder;