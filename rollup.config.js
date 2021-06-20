import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-polyfill-node';

import path from 'path';
import pkg from './package.json';

function workerUrl() {
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
        plugins: [
          resolve(),
          commonjs(),
        ],
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
      dir: 'dist-esm/browser-esm',
      name: "GeoTIFF",
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
  {
    input: 'src/geotiff.js',
    output: {
      dir: 'dist-esm/browser-umd',
      name: "GeoTIFF",
      format: 'umd',
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
