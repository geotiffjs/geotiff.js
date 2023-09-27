"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pako_1 = require("pako");
const basedecoder_js_1 = __importDefault(require("./basedecoder.js"));
class DeflateDecoder extends basedecoder_js_1.default {
    decodeBlock(buffer) {
        return (0, pako_1.inflate)(new Uint8Array(buffer)).buffer;
    }
}
exports.default = DeflateDecoder;
//# sourceMappingURL=deflate.js.map