/**
 * A no-op logger
 */
class DummyLogger {
  log() {}

  debug() {}

  info() {}

  warn() {}

  error() {}

  time() {}

  timeEnd() {}
}

let LOGGER = new DummyLogger();

/**
 *
 * @param {object} logger the new logger. e.g `console`
 */
export function setLogger(logger = new DummyLogger()) {
  LOGGER = logger;
}

export function debug(...args) {
  return LOGGER.debug(...args);
}

export function log(...args) {
  return LOGGER.log(...args);
}

export function info(...args) {
  return LOGGER.info(...args);
}

export function warn(...args) {
  return LOGGER.warn(...args);
}

export function error(...args) {
  return LOGGER.error(...args);
}

export function time(...args) {
  return LOGGER.time(...args);
}

export function timeEnd(...args) {
  return LOGGER.timeEnd(...args);
}
