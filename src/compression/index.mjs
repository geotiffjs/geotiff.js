const registry = new Map();

export function addDecoder(cases, importFn) {
  if (!Array.isArray(cases)) cases = [cases];
  cases.forEach(c => registry.set(c, importFn));
}

export async function getDecoder(fileDirectory) {
  const importFn = registry.get(fileDirectory.Compression);
  if (!importFn) {
    throw new Error(`Unknown compression method identifier: ${fileDirectory.Compression}`);
  }
  const Decoder = await importFn();
  return new Decoder(fileDirectory);
}

// Add default decoders to registry (end-user may override with other implementations)
addDecoder([undefined, 1], () => import('./raw.mjs').then(m => m.default));
addDecoder(5,              () => import('./lzw.mjs').then(m => m.default));
addDecoder(6,              () => { throw new Error('old style JPEG compression is not supported.') });
addDecoder(7,              () => import('./jpeg.mjs').then(m => m.default));
addDecoder([8, 32946],     () => import('./deflate.mjs').then(m => m.default));
addDecoder(32773,          () => import('./packbits.mjs').then(m => m.default));
addDecoder(34887,          () => import('./lerc.mjs').then(m => m.default));
