import { BaseSource } from './basesource';

class ArrayBufferSource extends BaseSource {
  constructor(arrayBuffer) {
    super();
    this.arrayBuffer = arrayBuffer;
  }

  fetchSlice(slice) {
    return this.arrayBuffer.slice(slice.offset, slice.offset + slice.length);
  }
}

export function makeBufferSource(arrayBuffer) {
  return new ArrayBufferSource(arrayBuffer);
}
