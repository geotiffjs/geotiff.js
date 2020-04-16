export default class DataView64 {
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
      combined = left + 2 ** 32 * right;
      if (!Number.isSafeInteger(combined)) {
        throw new Error(
          `${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
        );
      }
      return combined;
    }
    combined = 2 ** 32 * left + right;
    if (!Number.isSafeInteger(combined)) {
      throw new Error(
        `${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
      );
    }

    return combined;
  }

  getInt64(offset, littleEndian) {
    let left;
    let right;
    let combined;
    if (littleEndian) {
      left = this.getInt32(offset, littleEndian);
      right = this.getUint32(offset + 4, littleEndian);

      combined = left + 2 ** 32 * right;
      if (!Number.isSafeInteger(combined)) {
        throw new Error(
          `${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
        );
      }
      return combined;
    }
    left = this.getUint32(offset, littleEndian);
    right = this.getInt32(offset + 4, littleEndian);
    combined = 2 ** 32 * left + right;
    if (!Number.isSafeInteger(combined)) {
      throw new Error(
        `${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
      );
    }

    return combined;
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

  getFloat32(offset, littleEndian) {
    return this._dataView.getFloat32(offset, littleEndian);
  }

  getFloat64(offset, littleEndian) {
    return this._dataView.getFloat64(offset, littleEndian);
  }
}
