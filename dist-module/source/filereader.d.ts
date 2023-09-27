/**
 * Create a new source from a given file/blob.
 * @param {Blob} file The file or blob to read from.
 * @returns The constructed source
 */
export function makeFileReaderSource(file: Blob): FileReaderSource;
declare class FileReaderSource extends BaseSource {
    constructor(file: any);
    file: any;
}
import { BaseSource } from "./basesource.js";
export {};
//# sourceMappingURL=filereader.d.ts.map