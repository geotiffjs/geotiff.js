/**
 * @typedef {Object} Slice
 * @property {number} offset
 * @property {number} length
 */

/** @typedef {Slice & {data: ArrayBufferLike}} SliceWithData */

export class BaseSource {
  /**
   * @param {Array<Slice>} slices
   * @param {AbortSignal} [signal]
   * @returns {Promise<ArrayBufferLike[]>}
   */
  async fetch(slices, signal) {
    return Promise.all(
      slices.map(async (slice) => (await this.fetchSlice(slice, signal)).data),
    );
  }

  /**
   * @param {Slice} slice
   * @param {AbortSignal} [_signal]
   * @returns {Promise<SliceWithData>}
   */
  async fetchSlice(slice, _signal) {
    throw new Error(`fetching of slice ${slice} not possible, not implemented`);
  }

  /**
   * Returns the filesize if already determined and null otherwise
   * @returns {number|null}
   */
  get fileSize() {
    return null;
  }

  async close() {
    // no-op by default
  }
}
