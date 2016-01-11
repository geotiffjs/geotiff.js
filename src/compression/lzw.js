import AbstractDecoder from "../abstractdecoder.js"
var lzwCompress = require("lzwcompress");


export default class LZWDecoder extends AbstractDecoder {
  decodeBlock(buffer) {
    return lzwCompress.unpack(Array.prototype.slice.call(new Uint8Array(buffer)));
  }
}
