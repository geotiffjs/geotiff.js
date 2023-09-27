"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFileSource = void 0;
const fs_1 = __importDefault(require("fs"));
const basesource_js_1 = require("./basesource.js");
function closeAsync(fd) {
    return new Promise((resolve, reject) => {
        fs_1.default.close(fd, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
function openAsync(path, flags, mode = undefined) {
    return new Promise((resolve, reject) => {
        fs_1.default.open(path, flags, mode, (err, fd) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(fd);
            }
        });
    });
}
function readAsync(...args) {
    return new Promise((resolve, reject) => {
        fs_1.default.read(...args, (err, bytesRead, buffer) => {
            if (err) {
                reject(err);
            }
            else {
                resolve({ bytesRead, buffer });
            }
        });
    });
}
class FileSource extends basesource_js_1.BaseSource {
    constructor(path) {
        super();
        this.path = path;
        this.openRequest = openAsync(path, 'r');
    }
    async fetchSlice(slice) {
        // TODO: use `signal`
        const fd = await this.openRequest;
        const { buffer } = await readAsync(fd, Buffer.alloc(slice.length), 0, slice.length, slice.offset);
        return buffer.buffer;
    }
    async close() {
        const fd = await this.openRequest;
        await closeAsync(fd);
    }
}
function makeFileSource(path) {
    return new FileSource(path);
}
exports.makeFileSource = makeFileSource;
//# sourceMappingURL=file.js.map