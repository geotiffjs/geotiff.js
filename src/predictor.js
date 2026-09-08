const hostLittleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

/**
 * Reverses the byte order of every sample in place, so that samples of a file whose byte order
 * differs from the host's can be accumulated as typed array elements.
 * @param {Uint8Array} bytes
 * @param {number} bytesPerSample
 */
function swapBytes(bytes, bytesPerSample) {
  for (let i = 0; i < bytes.length; i += bytesPerSample) {
    for (let a = i, b = i + bytesPerSample - 1; a < b; ++a, --b) {
      const value = bytes[a];
      bytes[a] = bytes[b];
      bytes[b] = value;
    }
  }
}

/**
 * @param {Uint8Array|Uint16Array|Uint32Array} row
 * @param {number} stride
 */
function decodeRowAcc(row, stride) {
  let length = row.length - stride;
  let offset = 0;
  do {
    for (let i = stride; i > 0; i--) {
      row[offset + stride] += row[offset];
      offset++;
    }

    length -= stride;
  } while (length > 0);
}

/**
 * @param {Uint8Array} row
 * @param {number} stride
 * @param {number} bytesPerSample
 * @param {boolean} littleEndian byte order in which to reassemble the samples
 */
function decodeRowFloatingPoint(row, stride, bytesPerSample, littleEndian) {
  let index = 0;
  let count = row.length;
  const wc = count / bytesPerSample;

  while (count > stride) {
    for (let i = stride; i > 0; --i) {
      row[index + stride] += row[index];
      ++index;
    }
    count -= stride;
  }

  // Planes hold the samples' bytes from most to least significant.
  const copy = row.slice();
  for (let i = 0; i < wc; ++i) {
    for (let b = 0; b < bytesPerSample; ++b) {
      const plane = littleEndian ? bytesPerSample - b - 1 : b;
      row[(bytesPerSample * i) + b] = copy[(plane * wc) + i];
    }
  }
}

/**
 * @param {ArrayBufferLike} block
 * @param {number} predictor
 * @param {number} width
 * @param {number} height
 * @param {number[]} bitsPerSample
 * @param {number} planarConfiguration
 * @param {boolean} [littleEndian=true] byte order of the file the block comes from
 * @returns
 */
export function applyPredictor(block, predictor, width, height, bitsPerSample,
  planarConfiguration, littleEndian = true) {
  if (!predictor || predictor === 1) {
    return block;
  }

  for (let i = 0; i < bitsPerSample.length; ++i) {
    if (bitsPerSample[i] % 8 !== 0) {
      throw new Error('When decoding with predictor, only multiple of 8 bits are supported.');
    }
    if (bitsPerSample[i] !== bitsPerSample[0]) {
      throw new Error('When decoding with predictor, all samples must have the same size.');
    }
  }

  const bytesPerSample = bitsPerSample[0] / 8;
  const stride = planarConfiguration === 2 ? 1 : bitsPerSample.length;
  const swap = bytesPerSample > 1 && littleEndian !== hostLittleEndian;

  for (let i = 0; i < height; ++i) {
    // Last strip will be truncated if height % stripHeight != 0
    if (i * stride * width * bytesPerSample >= block.byteLength) {
      break;
    }
    let row;
    if (predictor === 2) { // horizontal prediction
      const bytes = new Uint8Array(
        block, i * stride * width * bytesPerSample, stride * width * bytesPerSample,
      );
      if (swap) {
        swapBytes(bytes, bytesPerSample);
      }
      switch (bitsPerSample[0]) {
        case 8:
          row = new Uint8Array(
            block, i * stride * width * bytesPerSample, stride * width * bytesPerSample,
          );
          break;
        case 16:
          row = new Uint16Array(
            block, i * stride * width * bytesPerSample, stride * width * bytesPerSample / 2,
          );
          break;
        case 32:
          row = new Uint32Array(
            block, i * stride * width * bytesPerSample, stride * width * bytesPerSample / 4,
          );
          break;
        default:
          throw new Error(`Predictor 2 not allowed with ${bitsPerSample[0]} bits per sample.`);
      }
      decodeRowAcc(row, stride);
      if (swap) {
        swapBytes(bytes, bytesPerSample);
      }
    } else if (predictor === 3) { // horizontal floating point
      row = new Uint8Array(
        block, i * stride * width * bytesPerSample, stride * width * bytesPerSample,
      );
      decodeRowFloatingPoint(row, stride, bytesPerSample, littleEndian);
    }
  }
  return block;
}
