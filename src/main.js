import GeoTIFF from './geotiff';
import { makeFetchSource } from './source';

/**
 * Main parsing function for GeoTIFF files.
 * @param {(string|ArrayBuffer)} data Raw data to parse the GeoTIFF from.
 * @param {Object} [options] further options.
 * @param {Boolean} [options.cache=false] whether or not decoded tiles shall be cached.
 * @returns {GeoTIFF} the parsed geotiff file.
 */
async function parse(source, options) {

  return await GeoTIFF.parse(source, options)

  // let rawData;
  // let i;
  // let strLen;
  // let view;
  // if (typeof data === 'string' || data instanceof String) {
  //   rawData = new ArrayBuffer(data.length * 2); // 2 bytes for each char
  //   view = new Uint16Array(rawData);
  //   for (i = 0, strLen = data.length; i < strLen; ++i) {
  //     view[i] = data.charCodeAt(i);
  //   }
  // } else if (data instanceof ArrayBuffer) {
  //   rawData = data;
  // } else {
  //   throw new Error('Invalid input data given.');
  // }
  // return new GeoTIFF(rawData, options);
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.parse = parse;
}
if (typeof window !== 'undefined') {
  window.GeoTIFF = { parse, makeFetchSource };
} else if (typeof self !== 'undefined') {
  self.GeoTIFF = { parse, makeFetchSource };
}

GeoTIFF.makeFetchSource = makeFetchSource;