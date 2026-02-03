import fs from 'fs';
import { BaseSource } from './basesource.js';

/**
 * @param {number} fd
 * @returns {Promise<void>}
 */
function closeAsync(fd) {
  return new Promise((resolve, reject) => {
    fs.close(fd, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * @param {string} path
 * @param {string} flags
 * @param {number|undefined} mode
 * @returns {Promise<number>}
 */
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

/**
 * @param {number} _fd
 * @param {Uint8Array} _buffer
 * @param {number} _offset
 * @param {number} _length
 * @param {number} _position
 * @returns {Promise<{bytesRead: number, buffer: Uint8Array}>}
 */
function readAsync(_fd, _buffer, _offset, _length, _position) {
  return new Promise((resolve, reject) => {
    fs.read(_fd, _buffer, _offset, _length, _position, (err, bytesRead, outBuffer) => {
      if (err) {
        reject(err);
      } else {
        resolve({ bytesRead, buffer: outBuffer });
      }
    });
  });
}

class FileSource extends BaseSource {
  /**
   * @param {string} path
   */
  constructor(path) {
    super();
    this.path = path;
    this.openRequest = openAsync(path, 'r');
  }

  /**
   * @param {import('./basesource.js').Slice} slice
   * @param {AbortSignal} [_signal] not implemented
   * @returns {Promise<import('./basesource.js').SliceWithData>}
   */
  async fetchSlice(slice, _signal) {
    // TODO: use `signal`
    const fd = await this.openRequest;
    const { buffer } = await readAsync(
      fd,
      new Uint8Array(slice.length),
      0,
      slice.length,
      slice.offset,
    );
    return {
      data: buffer.buffer,
      offset: slice.offset,
      length: slice.length,
    };
  }

  async close() {
    const fd = await this.openRequest;
    await closeAsync(fd);
  }
}

/** @param {string} path */
export function makeFileSource(path) {
  return new FileSource(path);
}
