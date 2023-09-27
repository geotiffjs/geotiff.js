import { BaseSource } from './basesource.js';
import { AbortError } from '../utils.js';

class ArrayBufferSource extends BaseSource {
  constructor(arrayBuffer) {
    super();
    this.arrayBuffer = arrayBuffer;
  }

  fetchSlice(slice, signal) {
    if (signal && signal.aborted) {
      throw new AbortError('Request aborted');
    }
    return this.arrayBuffer.slice(slice.offset, slice.offset + slice.length);
  }
}

export function makeBufferSource(arrayBuffer) {
  return new ArrayBufferSource(arrayBuffer);
}
