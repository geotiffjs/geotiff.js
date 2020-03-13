export default class DataSlice {
  constructor(arrayBuffer, sliceOffset, littleEndian, bigTiff) {
    this._dataView = new DataView(arrayBuffer);
    this._sliceOffset = sliceOffset;
    this._littleEndian = littleEndian;
    this._bigTiff = bigTiff;
  }

  get sliceOffset() {
    return this._sliceOffset;
  }

  get sliceTop() {
    return this._sliceOffset + this.buffer.byteLength;
  }

  get littleEndian() {
    return this._littleEndian;
  }

  get bigTiff() {
    return this._bigTiff;
  }

  get buffer() {
    return this._dataView.buffer;
  }

  covers(offset, length) {
    return this.sliceOffset <= offset && this.sliceTop >= offset + length;
  }

  readUint8(offset) {
    return this._dataView.getUint8(
      offset - this._sliceOffset, this._littleEndian,
    );
  }

  readInt8(offset) {
    return this._dataView.getInt8(
      offset - this._sliceOffset, this._littleEndian,
    );
  }

  readUint16(offset) {
    return this._dataView.getUint16(
      offset - this._sliceOffset, this._littleEndian,
    );
  }

  readInt16(offset) {
    return this._dataView.getInt16(
      offset - this._sliceOffset, this._littleEndian,
    );
  }

  readUint32(offset) {
    return this._dataView.getUint32(
      offset - this._sliceOffset, this._littleEndian,
    );
  }

  readInt32(offset) {
    return this._dataView.getInt32(
      offset - this._sliceOffset, this._littleEndian,
    );
  }

  readFloat32(offset) {
    return this._dataView.getFloat32(
      offset - this._sliceOffset, this._littleEndian,
    );
  }

  readFloat64(offset) {
    return this._dataView.getFloat64(
      offset - this._sliceOffset, this._littleEndian,
    );
  }

  readUint64(offset) {
    const left = this.readUint32(offset);
    const right = this.readUint32(offset + 4);
    let combined;
    if (this._littleEndian) {
      combined = left + 2 ** 32 * right;
      if (!Number.isSafeInteger(combined)) {
        console.error(
          combined,
          'exceeds MAX_SAFE_INTEGER. Precision may be lost.  Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues',
        );
      }
      return combined;
    }
    combined = 2 ** 32 * left + rightt;
    if (!Number.isSafeInteger(combined)) {
      console.error(
        combined,
        'exceeds MAX_SAFE_INTEGER. Precision may be lost.  Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues',
      );
    }

    return combined;
  }

  readInt64(offset) {
    let left;
    let right;
    if (this._littleEndian) {
      left = this.readInt32(offset);
      right = this.readUint32(offset + 4);

      combined = left + 2 ** 32 * right;
      if (!Number.isSafeInteger(combined)) {
        console.log(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');
      }
      return combined;
    }
    left = this.readUint32(offset - this._sliceOffset);
    right = this.readInt32(offset - this._sliceOffset + 4);
    combined = 2 ** 32 * left + rightt;
    if (!Number.isSafeInteger(combined)) {
      console.log(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');
    }

    return combined;
  }

  readOffset(offset) {
    if (this._bigTiff) {
      return this.readUint64(offset);
    }
    return this.readUint32(offset);
  }
}
