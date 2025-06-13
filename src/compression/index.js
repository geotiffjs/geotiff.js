const registry = new Map();
const preferWorkerMap = new Map();

/**
 * Either a number or undefined.
 * @typedef {(number|undefined)} NumberOrUndefined
 */

/**
 * Register a decoder for a specific compression method or a range of compressions
 * @param {(NumberOrUndefined|(NumberOrUndefined[]))} cases ids of the compression methods to register for
 * @param {function():Promise} importFn the function to import the decoder
 * @param {boolean} preferWorker_ Whether to prefer running the decoder in a worker
 */
export function addDecoder(cases, importFn, preferWorker_ = true) {
  if (!Array.isArray(cases)) {
    cases = [cases]; // eslint-disable-line no-param-reassign
  }
  cases.forEach((c) => {
    registry.set(c, importFn);
    preferWorkerMap.set(c, preferWorker_);
  });
}

/**
 * Get a decoder for a specific file directory
 * @param {object} fileDirectory the file directory of the image
 * @returns {Promise<Decoder>}
 */
export async function getDecoder(fileDirectory) {
  const importFn = registry.get(fileDirectory.Compression);
  if (!importFn) {
    throw new Error(`Unknown compression method identifier: ${fileDirectory.Compression}`);
  }
  const Decoder = await importFn();
  return new Decoder(fileDirectory);
}

/**
 * Whether to prefer running the decoder in a worker
 * @param {object} fileDirectory the file directory of the image
 * @returns {boolean}
 */
export function preferWorker(fileDirectory) {
  return preferWorkerMap.get(fileDirectory.Compression);
}

// Add default decoders to registry (end-user may override with other implementations)
addDecoder([undefined, 1], () => import('./raw.js').then((m) => m.default), false);
addDecoder(5, () => import('./lzw.js').then((m) => m.default));
addDecoder(6, () => {
  throw new Error('old style JPEG compression is not supported.');
});
addDecoder(7, () => import('./jpeg.js').then((m) => m.default));
addDecoder([8, 32946], () => import('./deflate.js').then((m) => m.default));
addDecoder(32773, () => import('./packbits.js').then((m) => m.default));
addDecoder(34887, () => import('./lerc.js')
  .then(async (m) => {
    await m.zstd.init();
    return m;
  })
  .then((m) => m.default),
);
addDecoder(50000, () => import('./zstd.js')
  .then(async (m) => {
    await m.zstd.init();
    return m;
  })
  .then((m) => m.default),
);
addDecoder(50001, () => import('./webimage.js').then((m) => m.default), false);
