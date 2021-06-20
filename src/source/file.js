import fs from 'fs';
import { BaseSource } from './basesource';

class FileSource extends BaseSource {
  constructor(path) {
    super();
    this.path = path;
    this.openRequest = fs.promises.open(path, 'r');
  }

  async fetchSlice(slice) {
    // TODO: use `signal`
    const fd = await this.openRequest;
    const { buffer } = await fd.read(
      Buffer.alloc(slice.length),
      0,
      slice.length,
      slice.offset,
    );
    return buffer.buffer;
  }

  async close() {
    const fd = await this.openRequest;
    await fd.close();
  }
}

export function makeFileSource(path) {
  return new FileSource(path);
}
