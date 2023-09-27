"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFileReaderSource = void 0;
const basesource_js_1 = require("./basesource.js");
class FileReaderSource extends basesource_js_1.BaseSource {
    constructor(file) {
        super();
        this.file = file;
    }
    async fetchSlice(slice, signal) {
        return new Promise((resolve, reject) => {
            const blob = this.file.slice(slice.offset, slice.offset + slice.length);
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
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
 * @returns The constructed source
 */
function makeFileReaderSource(file) {
    return new FileReaderSource(file);
}
exports.makeFileReaderSource = makeFileReaderSource;
//# sourceMappingURL=filereader.js.map