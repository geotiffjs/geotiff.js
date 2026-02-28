/**
 * A no-op logger
 */
class DummyLogger {
  /** @param {...unknown} _args */
  log(..._args) {}

  /** @param {...unknown} _args */
  debug(..._args) {}

  /** @param {...unknown} _args */
  info(..._args) {}

  /** @param {...unknown} _args */
  warn(..._args) {}

  /** @param {...unknown} _args */
  error(..._args) {}

  /** @param {...unknown} _args */
  time(..._args) {}

  /** @param {...unknown} _args */
  timeEnd(..._args) {}
}

let LOGGER = new DummyLogger();

/**
 * @param {DummyLogger} logger the new logger. e.g `console`
 */
export function setLogger(logger = new DummyLogger()) {
  LOGGER = logger;
}

/** @param {...unknown} args */
export function debug(...args) {
  return LOGGER.debug(...args);
}

/** @param {...unknown} args */
export function log(...args) {
  return LOGGER.log(...args);
}

/** @param {...unknown} args */
export function info(...args) {
  return LOGGER.info(...args);
}

/** @param {...unknown} args */
export function warn(...args) {
  return LOGGER.warn(...args);
}

/** @param {...unknown} args */
export function error(...args) {
  return LOGGER.error(...args);
}

/** @param {...unknown} args */
export function time(...args) {
  return LOGGER.time(...args);
}

/** @param {...unknown} args */
export function timeEnd(...args) {
  return LOGGER.timeEnd(...args);
}
