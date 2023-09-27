export class BlockedSource extends BaseSource {
    /**
     *
     * @param {BaseSource} source The underlying source that shall be blocked and cached
     * @param {object} options
     * @param {number} [options.blockSize]
     * @param {number} [options.cacheSize]
     */
    constructor(source: BaseSource, { blockSize, cacheSize }?: {
        blockSize?: number | undefined;
        cacheSize?: number | undefined;
    });
    source: BaseSource;
    blockSize: number;
    blockCache: QuickLRU<any, any>;
    /** @type {Map<number, Block>} */
    evictedBlocks: Map<number, Block>;
    blockRequests: Map<any, any>;
    blockIdsToFetch: Set<any>;
    abortedBlockIds: Set<any>;
    /**
     *
     * @param {AbortSignal} signal
     */
    fetchBlocks(signal: AbortSignal): void;
    /**
     *
     * @param {Set} blockIds
     * @returns {BlockGroup[]}
     */
    groupBlocks(blockIds: Set<any>): BlockGroup[];
    /**
     *
     * @param {import("./basesource").Slice[]} slices
     * @param {Map} blocks
     */
    readSliceData(slices: import("./basesource").Slice[], blocks: Map<any, any>): ArrayBuffer[];
}
import { BaseSource } from "./basesource.js";
import QuickLRU from "quick-lru";
declare class Block {
    /**
     *
     * @param {number} offset
     * @param {number} length
     * @param {ArrayBuffer} [data]
     */
    constructor(offset: number, length: number, data?: ArrayBuffer | undefined);
    offset: number;
    length: number;
    data: ArrayBuffer;
    /**
     * @returns {number} the top byte border
     */
    get top(): number;
}
declare class BlockGroup {
    /**
     *
     * @param {number} offset
     * @param {number} length
     * @param {number[]} blockIds
     */
    constructor(offset: number, length: number, blockIds: number[]);
    offset: number;
    length: number;
    blockIds: number[];
}
export {};
//# sourceMappingURL=blockedsource.d.ts.map