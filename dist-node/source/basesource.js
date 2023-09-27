"use strict";
/**
 * @typedef Slice
 * @property {number} offset
 * @property {number} length
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSource = void 0;
class BaseSource {
    /**
     *
     * @param {Slice[]} slices
     * @returns {ArrayBuffer[]}
     */
    async fetch(slices, signal = undefined) {
        return Promise.all(slices.map((slice) => this.fetchSlice(slice, signal)));
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
exports.BaseSource = BaseSource;
//# sourceMappingURL=basesource.js.map