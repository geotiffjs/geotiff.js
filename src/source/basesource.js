/**
 * @typedef Slice
 * @property {number} offset
 * @property {number} length
 */

export class BaseSource {
  /**
   * @param {Array<Slice>} slices
   * @param {AbortSignal} [signal]
   * @returns {Promise<*[]>}
   */
  async fetch(slices, signal) {
    return Promise.all(
      slices.map((slice) => this.fetchSlice(slice, signal)),
    );
  }

  /**
   * @param {Slice} slice
   * @param {AbortSignal} [_signal]
   * @returns {Promise<*>}
   */
  async fetchSlice(slice, _signal) {
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
