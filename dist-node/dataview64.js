"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const float16_1 = require("@petamoriken/float16");
class DataView64 {
    constructor(arrayBuffer) {
        this._dataView = new DataView(arrayBuffer);
    }
    get buffer() {
        return this._dataView.buffer;
    }
    getUint64(offset, littleEndian) {
        const left = this.getUint32(offset, littleEndian);
        const right = this.getUint32(offset + 4, littleEndian);
        let combined;
        if (littleEndian) {
            combined = left + ((2 ** 32) * right);
            if (!Number.isSafeInteger(combined)) {
                throw new Error(`${combined} exceeds MAX_SAFE_INTEGER. `
                    + 'Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues');
            }
            return combined;
        }
        combined = ((2 ** 32) * left) + right;
        if (!Number.isSafeInteger(combined)) {
            throw new Error(`${combined} exceeds MAX_SAFE_INTEGER. `
                + 'Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues');
        }
        return combined;
    }
    // adapted from https://stackoverflow.com/a/55338384/8060591
    getInt64(offset, littleEndian) {
        let value = 0;
        const isNegative = (this._dataView.getUint8(offset + (littleEndian ? 7 : 0)) & 0x80) > 0;
        let carrying = true;
        for (let i = 0; i < 8; i++) {
            let byte = this._dataView.getUint8(offset + (littleEndian ? i : 7 - i));
            if (isNegative) {
                if (carrying) {
                    if (byte !== 0x00) {
                        byte = ~(byte - 1) & 0xff;
                        carrying = false;
                    }
                }
                else {
                    byte = ~byte & 0xff;
                }
            }
            value += byte * (256 ** i);
        }
        if (isNegative) {
            value = -value;
        }
        return value;
    }
    getUint8(offset, littleEndian) {
        return this._dataView.getUint8(offset, littleEndian);
    }
    getInt8(offset, littleEndian) {
        return this._dataView.getInt8(offset, littleEndian);
    }
    getUint16(offset, littleEndian) {
        return this._dataView.getUint16(offset, littleEndian);
    }
    getInt16(offset, littleEndian) {
        return this._dataView.getInt16(offset, littleEndian);
    }
    getUint32(offset, littleEndian) {
        return this._dataView.getUint32(offset, littleEndian);
    }
    getInt32(offset, littleEndian) {
        return this._dataView.getInt32(offset, littleEndian);
    }
    getFloat16(offset, littleEndian) {
        return (0, float16_1.getFloat16)(this._dataView, offset, littleEndian);
    }
    getFloat32(offset, littleEndian) {
        return this._dataView.getFloat32(offset, littleEndian);
    }
    getFloat64(offset, littleEndian) {
        return this._dataView.getFloat64(offset, littleEndian);
    }
}
exports.default = DataView64;
//# sourceMappingURL=dataview64.js.map