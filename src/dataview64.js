import { getFloat16 } from '@petamoriken/float16';

export default class DataView64 {
  constructor(arrayBuffer) {
    this._dataView = new DataView(arrayBuffer);
  }

  get buffer() {
    return this._dataView.buffer;
  }

  get byteLength() {
    return this._dataView.byteLength;
  }

  getUint64(offset, littleEndian) {
    const left = this.getUint32(offset, littleEndian);
    const right = this.getUint32(offset + 4, littleEndian);
    if (littleEndian) {
      return (left << 32) | right;
    }
    return (right << 32) | left;
  }

  getInt64(offset, littleEndian) {
    let left;
    let right;
    if (littleEndian) {
      left = this.getInt32(offset, littleEndian);
      right = this.getUint32(offset + 4, littleEndian);

      return (left << 32) | right;
    }
    left = this.getUint32(offset, littleEndian);
    right = this.getInt32(offset + 4, littleEndian);
    return (right << 32) | left;
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

  /*
    Why have this?
    Sometimes you want to read the remaining 3 bytes in an ArrayBuffer and
    thus running getUint32 would exceed the length of the ArrayBuffer

    Note: I'm not sure this can handle different endianness
  */
  getUint24(offset) {
	  return (this._dataView.getUint16(offset) << 8) + this._dataView.getUint8(offset + 2);
  }

  getUint32(offset, littleEndian) {
    return this._dataView.getUint32(offset, littleEndian);
  }

  /*
    To Do: Implement litleEndian?
  */
  getUint40(offset, littleEndian) {
	  return (this._dataView.getUint32(offset) << 8) + this._dataView.getUint8(offset + 4);
  }

  /*
    To Do: Implement litleEndian?
  */
  getUint48(offset, littleEndian) {
	  return (this._dataView.getUint32(offset) << 16) + this._dataView.getUint16(offset + 4);
  }

  getInt32(offset, littleEndian) {
    return this._dataView.getInt32(offset, littleEndian);
  }

  getFloat16(offset, littleEndian) {
    return getFloat16(this._dataView, littleEndian);
  }

  getFloat32(offset, littleEndian) {
    return this._dataView.getFloat32(offset, littleEndian);
  }

  getFloat64(offset, littleEndian) {
    return this._dataView.getFloat64(offset, littleEndian);
  }
}
