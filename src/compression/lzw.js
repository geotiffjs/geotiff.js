var AbstractDecoder = require("../abstractdecoder.js");


var Decoder = function() {}

Decoder.prototype = Object.create(AbstractDecoder.prototype);

Decoder.prototype.decodeBlock = function(buffer) {
    var lzwCompress = require("lzwcompress");

    //Array.prototype.slice.call(new Uint16Array(buffer));
    return lzwCompress.unpack(Array.prototype.slice.call(new Uint8Array(buffer)));
  };

Decoder.prototype.constructor = Decoder;


module.exports = Decoder;