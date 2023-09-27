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
    fetch(slices: Slice[], signal?: undefined): ArrayBuffer[];
    /**
     *
     * @param {Slice} slice
     * @returns {ArrayBuffer}
     */
    fetchSlice(slice: Slice): ArrayBuffer;
    /**
     * Returns the filesize if already determined and null otherwise
     */
    get fileSize(): null;
    close(): Promise<void>;
}
export type Slice = {
    offset: number;
    length: number;
};
//# sourceMappingURL=basesource.d.ts.map