import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

/**
 * Rollup plugin. Resolves import statements to empty modules
 * 
 * import fs from 'fs' --> const fs = {}
 * 
 * @param {string[]} modules modules to treat as empty objects
 */
function resolveEmptyDefault(modules = []) {
  modules = new Set(modules);
  const prefix = 'resolve-empty:';
  return {
    name: 'resolve-empty',
    resolveId: (id) => modules.has(id) ? prefix + id : null,
    load: (id) => id.startsWith(prefix) ? `export default {};` : null,
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
      resolveEmptyDefault(['fs', 'http', 'https', 'through2']),
      resolve({ browser: true, preferBuiltins: false }),
      commonjs(),
    ],
  },
]
