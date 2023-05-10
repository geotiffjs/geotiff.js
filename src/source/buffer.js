import { ArrayBufferSource } from './arraybuffer.js';

class BufferSource extends ArrayBufferSource {
  constructor(buffer) {
    super(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  }
}

export function makeBufferSource(buffer) {
  return new BufferSource(buffer);
}
