"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeEnd = exports.time = exports.error = exports.warn = exports.info = exports.log = exports.debug = exports.setLogger = void 0;
/**
 * A no-op logger
 */
class DummyLogger {
    log() { }
    debug() { }
    info() { }
    warn() { }
    error() { }
    time() { }
    timeEnd() { }
}
let LOGGER = new DummyLogger();
/**
 *
 * @param {object} logger the new logger. e.g `console`
 */
function setLogger(logger = new DummyLogger()) {
    LOGGER = logger;
}
exports.setLogger = setLogger;
function debug(...args) {
    return LOGGER.debug(...args);
}
exports.debug = debug;
function log(...args) {
    return LOGGER.log(...args);
}
exports.log = log;
function info(...args) {
    return LOGGER.info(...args);
}
exports.info = info;
function warn(...args) {
    return LOGGER.warn(...args);
}
exports.warn = warn;
function error(...args) {
    return LOGGER.error(...args);
}
exports.error = error;
function time(...args) {
    return LOGGER.time(...args);
}
exports.time = time;
function timeEnd(...args) {
    return LOGGER.timeEnd(...args);
}
exports.timeEnd = timeEnd;
//# sourceMappingURL=logging.js.map