import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { terser } from 'rollup-plugin-terser';

import path from 'path';
import pkg from './package.json';

/**
 * Creates a separate bundle for worker url import, 
 * and emits as a separate fully bundled asset. Currently 
 * only Node & Chromium browsers support worker modules, so
 * the worker is a single bundled file for now.
 * 
 * import workerUrl from 'worker-url:./worker.js';
 * let worker = new Worker(workerUrl);
 * 
 * const workerUrl = new URL('./worker-12030.js', import.meta.url);
 * let worker = new Worker(workerUrl);
 */
const defaultPluginFactory = () => [resolve(), commonjs(), terser()];
function workerUrl(pluginFactory = defaultPluginFactory) {
  const prefix = 'worker-url:';
  return {
    name: 'worker-url',
    async resolveId(id, importer) {
      if (!id.startsWith(prefix)) return;
      const plainId = id.slice(prefix.length);
      const result = await this.resolve(plainId, importer);
      if (!result) return;
      return prefix + result.id;
    },
    async load(id) {
      if (!id.startsWith(prefix)) return;
      const filepath = id.slice(prefix.length);
      const bundle = await rollup({
        input: filepath,
        plugins: pluginFactory(),
      });
      const { output } = await bundle.generate({
        format: 'esm',
        inlineDynamicImports: true,
      });
      const fileId = this.emitFile({
        type: 'asset',
        name: path.basename(filepath),
        source: output[0].code,
      });
      return `export default import.meta.ROLLUP_FILE_URL_${fileId};`
    }
  }
}

export default [
  {
    input: 'src/geotiff.js',
    output: {
      dir: 'dist-esm/node',
      format: 'esm',
      assetFileNames: '[name]-[hash][extname]',
    },
    external: Object.keys(pkg.dependencies),
    plugins: [
      resolve({ preferBuiltins: true }),
      workerUrl(),
    ],
  },
  {
    input: 'src/geotiff.js',
    output: {
      dir: 'dist-esm/browser',
      format: 'esm',
      assetFileNames: '[name]-[hash][extname]',
    },
    plugins: [
      nodePolyfills(),
      resolve({
        preferBuiltins: false,
        mainFields: ['browser', 'module'],
      }),
      commonjs(),
      workerUrl(),
    ],
  },
]
