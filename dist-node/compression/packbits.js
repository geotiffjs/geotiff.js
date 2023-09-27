"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const basedecoder_js_1 = __importDefault(require("./basedecoder.js"));
class PackbitsDecoder extends basedecoder_js_1.default {
    decodeBlock(buffer) {
        const dataView = new DataView(buffer);
        const out = [];
        for (let i = 0; i < buffer.byteLength; ++i) {
            let header = dataView.getInt8(i);
            if (header < 0) {
                const next = dataView.getUint8(i + 1);
                header = -header;
                for (let j = 0; j <= header; ++j) {
                    out.push(next);
                }
                i += 1;
            }
            else {
                for (let j = 0; j <= header; ++j) {
                    out.push(dataView.getUint8(i + j + 1));
                }
                i += header + 1;
            }
        }
        return new Uint8Array(out).buffer;
    }
}
exports.default = PackbitsDecoder;
//# sourceMappingURL=packbits.js.map