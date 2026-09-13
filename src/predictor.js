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

const HOST_LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

/**
 * Reverse the bytes of each sample in place so a block stored in one byte
 * order can be processed through host-endian typed-array views.
 * @param {ArrayBufferLike} block
 * @param {number} bytesPerSample
 */
function swapByteOrder(block, bytesPerSample) {
  const bytes = new Uint8Array(block);
  const length = bytes.length - (bytes.length % bytesPerSample);
  for (let i = 0; i < length; i += bytesPerSample) {
    for (let j = 0, k = bytesPerSample - 1; j < k; ++j, --k) {
      const tmp = bytes[i + j];
      bytes[i + j] = bytes[i + k];
      bytes[i + k] = tmp;
    }
  }
}

/**
 * @param {Uint8Array} row
 * @param {number} stride
 * @param {number} bytesPerSample
 */
function decodeRowFloatingPoint(row, stride, bytesPerSample) {
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

  const copy = row.slice();
  for (let i = 0; i < wc; ++i) {
    for (let b = 0; b < bytesPerSample; ++b) {
      row[(bytesPerSample * i) + b] = copy[((bytesPerSample - b - 1) * wc) + i];
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
 * @param {boolean} [littleEndian] the byte order of the file
 * @returns
 */
export function applyPredictor(block, predictor, width, height, bitsPerSample,
  planarConfiguration, littleEndian) {
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

  // Predictor 2 accumulates through host-endian typed-array views, so for a
  // file stored in the other byte order the multi-byte samples must be
  // swapped to host order first and back afterwards, keeping the block in
  // file byte order for the downstream sample reads.
  const swap = predictor === 2 && bytesPerSample > 1
    && littleEndian !== undefined && littleEndian !== HOST_LITTLE_ENDIAN;
  if (swap) {
    swapByteOrder(block, bytesPerSample);
  }

  for (let i = 0; i < height; ++i) {
    // Last strip will be truncated if height % stripHeight != 0
    if (i * stride * width * bytesPerSample >= block.byteLength) {
      break;
    }
    let row;
    if (predictor === 2) { // horizontal prediction
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
    } else if (predictor === 3) { // horizontal floating point
      row = new Uint8Array(
        block, i * stride * width * bytesPerSample, stride * width * bytesPerSample,
      );
      decodeRowFloatingPoint(row, stride, bytesPerSample);
    }
  }

  if (swap) {
    swapByteOrder(block, bytesPerSample);
  }
  return block;
}
