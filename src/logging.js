/**
 * A no-op logger
 */
class DummyLogger {
  /** @param {...any} _args */
  log(..._args) {}

  /** @param {...any} _args */
  debug(..._args) {}

  /** @param {...any} _args */
  info(..._args) {}

  /** @param {...any} _args */
  warn(..._args) {}

  /** @param {...any} _args */
  error(..._args) {}

  /** @param {...any} _args */
  time(..._args) {}

  /** @param {...any} _args */
  timeEnd(..._args) {}
}

let LOGGER = new DummyLogger();

/**
 * @param {DummyLogger} logger the new logger. e.g `console`
 */
export function setLogger(logger = new DummyLogger()) {
  LOGGER = logger;
}

/** @param {...any} args */
export function debug(...args) {
  return LOGGER.debug(...args);
}

/** @param {...any} args */
export function log(...args) {
  return LOGGER.log(...args);
}

/** @param {...any} args */
export function info(...args) {
  return LOGGER.info(...args);
}

/** @param {...any} args */
export function warn(...args) {
  return LOGGER.warn(...args);
}

/** @param {...any} args */
export function error(...args) {
  return LOGGER.error(...args);
}

/** @param {...any} args */
export function time(...args) {
  return LOGGER.time(...args);
}

/** @param {...any} args */
export function timeEnd(...args) {
  return LOGGER.timeEnd(...args);
}
