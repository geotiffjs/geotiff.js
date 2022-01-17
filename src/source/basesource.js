/**
 * @typedef Slice
 * @property {number} offset
 * @property {number} length
 */

export class BaseSource {
  /**
   *
   * @param {Slice[]} slices
   * @returns {ArrayBuffer[]}
   */
  async fetch(slices, signal = undefined) {
    return Promise.all(
      slices.map((slice) => this.fetchSlice(slice, signal)),
    );
  }

  /**
   *
   * @param {Slice} slice
   * @returns {ArrayBuffer}
   */
  async fetchSlice(slice) {
    throw new Error(`fetching of slice ${slice} not possible, not implemented`);
  }

  /**
   * Returns the filesize if already determined and null otherwise
   */
  get fileSize() {
    return null;
  }

  async close() {
    // no-op by default
  }
}
