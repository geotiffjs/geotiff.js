"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDecoder = exports.addDecoder = void 0;
const registry = new Map();
function addDecoder(cases, importFn) {
    if (!Array.isArray(cases)) {
        cases = [cases]; // eslint-disable-line no-param-reassign
    }
    cases.forEach((c) => registry.set(c, importFn));
}
exports.addDecoder = addDecoder;
async function getDecoder(fileDirectory) {
    const importFn = registry.get(fileDirectory.Compression);
    if (!importFn) {
        throw new Error(`Unknown compression method identifier: ${fileDirectory.Compression}`);
    }
    const Decoder = await importFn();
    return new Decoder(fileDirectory);
}
exports.getDecoder = getDecoder;
// Add default decoders to registry (end-user may override with other implementations)
addDecoder([undefined, 1], () => Promise.resolve().then(() => __importStar(require('./raw.js'))).then((m) => m.default));
addDecoder(5, () => Promise.resolve().then(() => __importStar(require('./lzw.js'))).then((m) => m.default));
addDecoder(6, () => {
    throw new Error('old style JPEG compression is not supported.');
});
addDecoder(7, () => Promise.resolve().then(() => __importStar(require('./jpeg.js'))).then((m) => m.default));
addDecoder([8, 32946], () => Promise.resolve().then(() => __importStar(require('./deflate.js'))).then((m) => m.default));
addDecoder(32773, () => Promise.resolve().then(() => __importStar(require('./packbits.js'))).then((m) => m.default));
addDecoder(34887, () => Promise.resolve().then(() => __importStar(require('./lerc.js'))).then((m) => m.default));
addDecoder(50001, () => Promise.resolve().then(() => __importStar(require('./webimage.js'))).then((m) => m.default));
//# sourceMappingURL=index.js.map