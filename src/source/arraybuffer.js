import { BaseSource } from './basesource.js';
import { AbortError } from '../utils.js';

export class ArrayBufferSource extends BaseSource {
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

export function makeArrayBufferSource(arrayBuffer) {
  return new ArrayBufferSource(arrayBuffer);
}
