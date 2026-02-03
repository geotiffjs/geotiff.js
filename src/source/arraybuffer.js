import { BaseSource } from './basesource.js';
import { AbortError } from '../utils.js';

class ArrayBufferSource extends BaseSource {
  /**
   * @param {ArrayBuffer} arrayBuffer
   */
  constructor(arrayBuffer) {
    super();
    this.arrayBuffer = arrayBuffer;
  }

  /**
   * @param {import('./basesource.js').Slice} slice
   * @param {AbortSignal} [signal]
   * @returns {Promise<import('./basesource.js').SliceWithData>}
   */
  fetchSlice(slice, signal) {
    if (signal && signal.aborted) {
      throw new AbortError('Request aborted');
    }
    return Promise.resolve({
      data: this.arrayBuffer.slice(slice.offset, slice.offset + slice.length),
      offset: slice.offset,
      length: slice.length,
    });
  }
}

/** @param {ArrayBuffer} arrayBuffer */
export function makeBufferSource(arrayBuffer) {
  return new ArrayBufferSource(arrayBuffer);
}
