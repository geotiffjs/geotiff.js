import AbstractDecoder from '../abstractdecoder';

const MIN_BITS = 9;
const MAX_BITS = 12;
const CLEAR_CODE = 256; // clear code
const EOI_CODE = 257; // end of information

class LZW {
  constructor() {
    this.littleEndian = false;
    this.position = 0;

    this._makeEntryLookup = false;
    this.dictionary = [];
  }

  initDictionary() {
    this.dictionary = new Array(258);
    this.entryLookup = {};
    this.byteLength = MIN_BITS;
    // i really feal like i <= 257, but I get strange unknown words that way.
    for (let i = 0; i <= 257; ++i) {
      this.dictionary[i] = [i];
      if (this._makeEntryLookup) {
        this.entryLookup[i] = i;
      }
    }
  }

  decompress(input) {
    this._makeEntryLookup = false; // for speed
    this.initDictionary();
    this.position = 0;
    this.result = [];
    if (!input.buffer) {
      input = new Uint8Array(input);
    }
    const mydataview = new DataView(input.buffer);
    let code = this.getNext(mydataview);
    let oldCode;
    while (code !== EOI_CODE) {
      if (code === CLEAR_CODE) {
        this.initDictionary();
        code = this.getNext(mydataview);
        while (code === CLEAR_CODE) {
          code = this.getNext(mydataview);
        }
        if (code > CLEAR_CODE) {
          throw new Error(`corrupted code at scanline ${code}`);
        }
        if (code === EOI_CODE) {
          break;
        } else {
          const val = this.dictionary[code];
          this.appendArray(this.result, val);
          oldCode = code;
        }
      } else {
        if (this.dictionary[code] !== undefined) {
          let val = this.dictionary[code];
          this.appendArray(this.result, val);
          const newVal = this.dictionary[oldCode].concat(this.dictionary[code][0]);
          this.addToDictionary(newVal);
          oldCode = code;
        } else {
          const oldVal = this.dictionary[oldCode];
          if (!oldVal) {
            throw new Error(`Bogus entry. Not in dictionary, ${oldCode} / ${this.dictionary.length}, position: ${this.position}`);
          }
          const newVal = oldVal.concat(this.dictionary[oldCode][0]);
          this.appendArray(this.result, newVal);
          this.addToDictionary(newVal);
          oldCode = code;
        }
      }
      // This is strange. It seems like the
      if (this.dictionary.length >= Math.pow(2, this.byteLength) - 1) {
        this.byteLength++;
      }
      code = this.getNext(mydataview);
    }
    return new Uint8Array(this.result);
  }

  appendArray(dest, source) {
    for (let i = 0; i < source.length; ++i) {
      dest.push(source[i]);
    }
    return dest;
  }

  haveBytesChanged() {
    if (this.dictionary.length >= Math.pow(2, this.byteLength)) {
      this.byteLength++;
      return true;
    }
    return false;
  }

  addToDictionary(arr) {
    this.dictionary.push(arr);
    if (this._makeEntryLookup) {
      this.entryLookup[arr] = this.dictionary.length - 1;
    }
    this.haveBytesChanged();
    return this.dictionary.length - 1;
  }

  getNext(dataview) {
    const byte = this.getByte(dataview, this.position, this.byteLength);
    this.position += this.byteLength;
    return byte;
  }

  // This binary representation might actually be as fast as the completely
  // illegible bit shift approach
  getByte(dataview, position, length) {
    const d = position % 8;
    const a = Math.floor(position / 8);
    const de = 8 - d;
    const ef = (position + length) - ((a + 1) * 8);
    let fg = (8 * (a + 2)) - (position + length);
    const dg = ((a + 2) * 8) - position;
    fg = Math.max(0, fg);
    if (a >= dataview.byteLength) {
      console.warn('ran off the end of the buffer before finding EOI_CODE (end on input code)');
      return EOI_CODE;
    }
    let chunk1 = dataview.getUint8(a, this.littleEndian) & (Math.pow(2, 8 - d) - 1);
    chunk1 = chunk1 << (length - de);
    let chunks = chunk1;
    if (a + 1 < dataview.byteLength) {
      let chunk2 = dataview.getUint8(a + 1, this.littleEndian) >>> fg;
      chunk2 = chunk2 << Math.max(0, (length - dg));
      chunks += chunk2;
    }
    if (ef > 8 && a + 2 < dataview.byteLength) {
      const hi = ((a + 3) * 8) - (position + length);
      const chunk3 = dataview.getUint8(a + 2, this.littleEndian) >>> hi;
      chunks += chunk3;
    }
    return chunks;
  }

// compress has not been optimized and uses a uint8 array to hold binary values.
  compress(input) {
    this._makeEntryLookup = true;
    this.initDictionary();
    this.position = 0;
    let resultBits = [];
    let omega = [];
    resultBits = this.appendArray(resultBits, this.binaryFromByte(CLEAR_CODE, this.byteLength));
    // resultBits.concat(Array.from(this.binaryFromByte(this.CLEAR_CODE, this.byteLength)))
    for (let i = 0; i < input.length; ++i) {
      var k = [input[i]];
      var omk = omega.concat(k);
      if (this.entryLookup[omk] !== undefined) {
        omega = omk;
      } else {
        const code = this.entryLookup[omega];
        const bin = this.binaryFromByte(code, this.byteLength);
        resultBits = this.appendArray(resultBits, bin);
        this.addToDictionary(omk);
        omega = k;
        if (this.dictionary.length >= Math.pow(2, MAX_BITS)) {
          resultBits = this.appendArray(resultBits, this.binaryFromByte(CLEAR_CODE, this.byteLength));
          this.initDictionary();
        }
      }
    }
    const code = this.entryLookup[omega];
    const bin = this.binaryFromByte(code, this.byteLength);
    resultBits = this.appendArray(resultBits, bin);
    resultBits = resultBits = this.appendArray(resultBits, this.binaryFromByte(EOI_CODE, this.byteLength));
    this.binary = resultBits;
    this.result = this.binaryToUint8(resultBits);
    return this.result;
  }

  byteFromCode(code) {
    return this.dictionary[code];
  }

  binaryFromByte(byte, byteLength = 8) {
    const res = new Uint8Array(byteLength);
    for (let i = 0; i < res.length; ++i) {
      const mask = Math.pow(2, i);
      const isOne = (byte & mask) > 0;
      res[res.length - 1 - i] = isOne;
    }
    return res;
  }

  binaryToNumber(bin) {
    let res = 0;
    for (let i = 0; i < bin.length; ++i) {
      res += Math.pow(2, bin.length - i - 1) * bin[i];
    }
    return res;
  }

  inputToBinary(input, inputByteLength = 8) {
    const res = new Uint8Array(input.length * inputByteLength);
    for (let i = 0; i < input.length; ++i) {
      const bin = this.binaryFromByte(input[i], inputByteLength);
      res.set(bin, i * inputByteLength);
    }
    return res;
  }

  binaryToUint8(bin) {
    const result = new Uint8Array(Math.ceil(bin.length / 8));
    let index = 0;
    for (let i = 0; i < bin.length; i += 8) {
      let val = 0;
      for (let j = 0; j < 8 && i + j < bin.length; ++j) {
        val += bin[i + j] * Math.pow(2, 8 - j - 1);
      }
      result[index] = val;
      ++index;
    }
    return result;
  }
}

// the actual decoder interface

export default class LZWDecoder extends AbstractDecoder {
  decodeBlock(buffer) {
    // decompressor = new LZW();
    return Promise.resolve((new LZW()).decompress(buffer).buffer);
  }
}
