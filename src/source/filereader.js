import { BaseSource } from './basesource.js';

class FileReaderSource extends BaseSource {
  /**
   * @param {Blob} file
   */
  constructor(file) {
    super();
    this.file = file;
  }

  /**
   * @param {import('./basesource.js').Slice} slice
   * @param {AbortSignal} signal
   * @returns {Promise<import('./basesource.js').SliceWithData>}
   */
  async fetchSlice(slice, signal) {
    return new Promise((resolve, reject) => {
      const blob = this.file.slice(slice.offset, slice.offset + slice.length);
      const reader = new FileReader();
      reader.onload = () => resolve({
        data: /** @type {ArrayBuffer} */ (reader.result),
        offset: slice.offset,
        length: slice.length,
      });
      reader.onerror = reject;
      reader.onabort = reject;
      reader.readAsArrayBuffer(blob);

      if (signal) {
        signal.addEventListener('abort', () => reader.abort());
      }
    });
  }
}

/**
 * Create a new source from a given file/blob.
 * @param {Blob} file The file or blob to read from.
 * @returns {FileReaderSource} The constructed source
 */
export function makeFileReaderSource(file) {
  return new FileReaderSource(file);
}
