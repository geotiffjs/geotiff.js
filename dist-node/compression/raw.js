"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const basedecoder_js_1 = __importDefault(require("./basedecoder.js"));
class RawDecoder extends basedecoder_js_1.default {
    decodeBlock(buffer) {
        return buffer;
    }
}
exports.default = RawDecoder;
//# sourceMappingURL=raw.js.map