import fs from 'fs';
import { BaseSource } from './basesource.js';

function closeAsync(fd) {
  return /** @type{Promise<void>} */ (new Promise((resolve, reject) => {
    fs.close(fd, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  }));
}

function openAsync(path, flags, mode = undefined) {
  return new Promise((resolve, reject) => {
    fs.open(path, flags, mode, (err, fd) => {
      if (err) {
        reject(err);
      } else {
        resolve(fd);
      }
    });
  });
}

function readAsync(_fd, _buffer, _offset, _length, _position) {
  return new Promise((resolve, reject) => {
    fs.read(_fd, _buffer, _offset, _length, _position, (err, bytesRead, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve({ bytesRead, buffer });
      }
    });
  });
}

class FileSource extends BaseSource {
  constructor(path) {
    super();
    this.path = path;
    this.openRequest = openAsync(path, 'r');
  }

  async fetchSlice(slice) {
    // TODO: use `signal`
    const fd = await this.openRequest;
    const { buffer } = await readAsync(
      fd,
      Buffer.alloc(slice.length),
      0,
      slice.length,
      slice.offset,
    );
    return buffer.buffer;
  }

  async close() {
    const fd = await this.openRequest;
    await closeAsync(fd);
  }
}

export function makeFileSource(path) {
  return new FileSource(path);
}
