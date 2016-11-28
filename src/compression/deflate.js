"use strict";

var AbstractDecoder = require("../abstractdecoder.js");
var pakoInflate = require('pako/lib/inflate').inflate;

function DeflateDecoder() { }

DeflateDecoder.prototype = Object.create(AbstractDecoder.prototype);
DeflateDecoder.prototype.constructor = DeflateDecoder;
DeflateDecoder.prototype.decodeBlock = function(buffer) {
  return pakoInflate(new Uint8Array(buffer)).buffer;
};

module.exports = DeflateDecoder;
