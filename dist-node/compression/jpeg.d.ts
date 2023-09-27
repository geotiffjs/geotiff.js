export default class JpegDecoder extends BaseDecoder {
    constructor(fileDirectory: any);
    reader: JpegStreamReader;
    decodeBlock(buffer: any): ArrayBufferLike;
}
import BaseDecoder from "./basedecoder.js";
declare class JpegStreamReader {
    jfif: {
        version: {
            major: any;
            minor: any;
        };
        densityUnits: any;
        xDensity: number;
        yDensity: number;
        thumbWidth: any;
        thumbHeight: any;
        thumbData: any;
    } | null;
    adobe: {
        version: any;
        flags0: number;
        flags1: number;
        transformCode: any;
    } | null;
    quantizationTables: any[];
    huffmanTablesAC: any[];
    huffmanTablesDC: any[];
    resetFrames(): void;
    frames: any[] | undefined;
    parse(data: any): void;
    resetInterval: number | undefined;
    getResult(): Uint8Array;
}
export {};
//# sourceMappingURL=jpeg.d.ts.map