const registry = new Map();

/**
 * @typedef {{
 *  tileWidth: number,
 *  tileHeight: number,
 *  planarConfiguration: number,
 *  bitsPerSample: number,
 *  predictor: number,
 * }} DecoderParameters
*/

/**
 * Default decoder parameter retrieval function
 * @param {import('../imagefiledirectory.js').ImageFileDirectory} fileDirectory
 * @returns {DecoderParameters}
 */
async function defaultDecoderParameterFn(fileDirectory) {
  const isTiled = !fileDirectory.hasTag('StripOffsets');
  return {
    tileWidth: isTiled ? fileDirectory.getValue('TileWidth') : fileDirectory.getValue('ImageWidth'),
    tileHeight: isTiled ? fileDirectory.getValue('TileLength') : (
      fileDirectory.getValue('RowsPerStrip') || fileDirectory.getValue('ImageLength')
    ),
    planarConfiguration: fileDirectory.getValue('PlanarConfiguration'),
    bitsPerSample: fileDirectory.getValue('BitsPerSample'),
    predictor: fileDirectory.getValue('Predictor') || 1,
  };
}

/**
 * Either a number or undefined.
 * @typedef {(number|undefined)} NumberOrUndefined
 */

/**
 * Register a decoder for a specific compression method or a range of compressions
 * @param {(NumberOrUndefined|(NumberOrUndefined[]))} cases ids of the compression methods to register for
 * @param {function():Promise} importFn the function to import the decoder
 * @param {function():Promise} decoderParameterFn
 * @param {boolean} preferWorker_ Whether to prefer running the decoder in a worker
 */
export function addDecoder(cases, importFn, decoderParameterFn = defaultDecoderParameterFn, preferWorker_ = true) {
  if (!Array.isArray(cases)) {
    cases = [cases]; // eslint-disable-line no-param-reassign
  }
  cases.forEach((c) => {
    registry.set(c, { importFn, decoderParameterFn, preferWorker: preferWorker_ });
  });
}

/**
 * Get the required decoder parameters for a specific compression method
 * @param {NumberOrUndefined} compression
 * @param {import('../imagefiledirectory.js').ImageFileDirectory} fileDirectory
 */
export async function getDecoderParameters(compression, fileDirectory) {
  if (!registry.has(compression)) {
    throw new Error(`Unknown compression method identifier: ${compression}`);
  }
  const { decoderParameterFn } = registry.get(compression);
  return decoderParameterFn(fileDirectory);
}

/**
 * Get a decoder for a specific compression and parameters
 * @param {number} compression the compression method identifier
 * @param {DecoderParameters} decoderParameters the parameters for the decoder
 * @returns {Promise<import('./basedecoder.js').default>}
 */
export async function getDecoder(compression, decoderParameters) {
  if (!registry.has(compression)) {
    throw new Error(`Unknown compression method identifier: ${compression}`);
  }
  const { importFn } = registry.get(compression);
  const Decoder = await importFn();
  return new Decoder(decoderParameters);
}

/**
 * Whether to prefer running the decoder in a worker
 * @param {object} fileDirectory the file directory of the image
 * @returns {boolean}
 */
export function preferWorker(compression) {
  if (!registry.has(compression)) {
    throw new Error(`Unknown compression method identifier: ${compression}`);
  }
  return registry.get(compression).preferWorker;
}

const defaultDecoderDefinitions = [
  // No compression
  {
    cases: [undefined, 1],
    importFn: () => import('./raw.js').then((m) => m.default),
    preferWorker: false,
  },
  // LZW
  {
    cases: 5,
    importFn: () => import('./lzw.js').then((m) => m.default),
  },
  // Old-style JPEG
  {
    cases: 6,
    importFn: () => {
      throw new Error('old style JPEG compression is not supported.');
    },
  },
  // JPEG
  {
    cases: 7,
    importFn: () => import('./jpeg.js').then((m) => m.default),
    decoderParameterFn: async (fileDirectory) => {
      return {
        ...await defaultDecoderParameterFn(fileDirectory),
        JPEGTables: await fileDirectory.loadValue('JPEGTables'),
      };
    },
  },
  // Deflate / Adobe Deflate
  {
    cases: [8, 32946],
    importFn: () => import('./deflate.js').then((m) => m.default),
  },
  // PackBits
  {
    cases: 32773,
    importFn: () => import('./packbits.js').then((m) => m.default),
  },
  // LERC
  {
    cases: 34887,
    importFn: () => import('./lerc.js')
      .then(async (m) => {
        await m.zstd.init();
        return m;
      })
      .then((m) => m.default),
    decoderParameterFn: async (fileDirectory) => {
      return {
        ...await defaultDecoderParameterFn(fileDirectory),
        LercParameters: await fileDirectory.loadValue('LercParameters'),
      };
    },
  },
  // zstd
  {
    cases: 50000,
    importFn: () => import('./zstd.js')
      .then(async (m) => {
        await m.zstd.init();
        return m;
      })
      .then((m) => m.default),
  },
  // WebP Images
  {
    cases: 50001,
    importFn: () => import('./webimage.js').then((m) => m.default),
    preferWorker: false,
  },
];

// Add default decoders to registry (end-user may override with other implementations)
for (const decoderDefinition of defaultDecoderDefinitions) {
  const { cases, importFn, decoderParameterFn, preferWorker: preferWorker_ } = decoderDefinition;
  addDecoder(cases, importFn, decoderParameterFn, preferWorker_);
}
