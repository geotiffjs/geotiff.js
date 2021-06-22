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

const bundle = (base) => {
  return ['src/geotiff.js', 'src/decoder.worker.js'].map(input => {
    const plugins = typeof base?.plugins === 'function' ? base.plugins() : base.plugins;
    return { ...base, plugins, input };
  });
}

const node = (output) => {
  return bundle({
    output,
    external: [...Object.keys(pkg.dependencies), 'threads/worker'],
    plugins: () => resolve({ preferBuiltins: true })
  })
}

const browser = (output, minify = false) => {
  return bundle({
    output,
    context: 'window',
    plugins: () => [
      resolveEmptyDefault(['fs', 'http', 'https', 'through2']),
      resolve({ browser: true, preferBuiltins: false }),
      commonjs(),
    ],
  })
}

export default [
  node({ dir: 'dist-node', format: 'cjs' }),
  node({ dir: 'dist-node-esm', format: 'esm' }),
  browser({ dir: 'dist-browser', name: 'GeoTIFF', format: 'umd' }),
  browser({ dir: 'dist-browser-esm', format: 'esm' }),
].flat();
