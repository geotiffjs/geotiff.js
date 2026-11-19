const Worker = /** @type {typeof globalThis.Worker} */ (/** @type {unknown} */ (require('web-worker')));

module.exports = function create() {
  return new Worker(require.resolve('./decoder.js'), { type: 'module' });
};
