"use strict";

var GeoTIFF = require("./geotiff.js");
var GeoTIFFWriter = require("./geotiffwriter.js");

/**
 * Main parsing function for GeoTIFF files.
 * @param {(string|ArrayBuffer)} data Raw data to parse the GeoTIFF from.
 * @param {Object} [options] further options.
 * @param {Boolean} [options.cache=false] whether or not decoded tiles shall be cached.
 * @returns {GeoTIFF} the parsed geotiff file.
 */
var parse = function(data, options) {
  var rawData, i, strLen, view;
  if (typeof data === "string" || data instanceof String) {
    rawData = new ArrayBuffer(data.length * 2); // 2 bytes for each char
    view = new Uint16Array(rawData);
    for (i=0, strLen=data.length; i<strLen; ++i) {
      view[i] = data.charCodeAt(i);
    }
  }
  else if (data instanceof ArrayBuffer) {
    rawData = data;
  }
  else {
    throw new Error("Invalid input data given.");
  }
  return new GeoTIFF(rawData, options);
};

/**
 * Main creating function for GeoTIFF files.
 * @param {(Array)} three dimensional array of pixel value
 * @returns {metadata} metadata
 */
var create = function(values, metadata) {
  return GeoTIFFWriter.write_geotiff(values, metadata);
};

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports.parse = parse;
  module.exports.create = create;
}
if (typeof window !== "undefined") {
  window["GeoTIFF"] = { create: create, parse: parse };
} else if (typeof self !== "undefined") {
  self["GeoTIFF"] = { create: create, parse: parse }; // jshint ignore:line
}

