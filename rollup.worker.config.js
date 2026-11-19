/* eslint-disable import/no-extraneous-dependencies */

import { fileURLToPath } from 'url';
import baseConfig from './rollup.config.js';

const wasmModule = fileURLToPath(new URL('./dist-module/compression/lerc-wasm.js', import.meta.url));

export default {
  ...baseConfig,
  input: 'dist-module/worker/decoder.js',
  external: [wasmModule],
  output: {
    file: 'dist-module/worker/create.js',
    format: 'iife',
    globals: { [wasmModule]: 'lercWasmUrl' },
    inlineDynamicImports: true,
  },
  plugins: [
    ...baseConfig.plugins,
    {
      name: 'serialize worker and export create function',
      resolveImportMeta(property) {
        return property === 'url' ? 'self.location.href' : null;
      },
      renderChunk(code) {
        return `\
import Worker from 'web-worker';
import wasmUrl from '../compression/lerc-wasm.js';

export default function create() {
  const source = 'const lercWasmUrl = ' + JSON.stringify(wasmUrl) + ';\\n' + ${JSON.stringify(code)};
  return new Worker(URL.createObjectURL(new Blob([source], { type: 'application/javascript' })));
}`;
      },
    },
  ],
};
