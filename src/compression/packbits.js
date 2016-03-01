"use strict";

var AbstractDecoder = require("../abstractdecoder.js");


function PackbitsDecoder() { }

PackbitsDecoder.prototype = Object.create(AbstractDecoder.prototype);
PackbitsDecoder.prototype.constructor = PackbitsDecoder;
PackbitsDecoder.prototype.decodeBlock = function(buffer) {
  var dataView = new DataView(buffer);
  var out = [];
  var i, j;

  for (i=0; i < buffer.byteLength; ++i) {
    var header = dataView.getInt8(i);
    if (header < 0) {
      var next = dataView.getUint8(i+1);
      header = -header;
      for (j=0; j<=header; ++j) {
        out.push(next);
      }
      i += 1;
    }
    else {
      for (j=0; j<=header; ++j) {
        out.push(dataView.getUint8(i+j+1));
      }
      i += header + 1;
    }
  }
  return new Uint8Array(out).buffer;
};

module.exports = PackbitsDecoder;
