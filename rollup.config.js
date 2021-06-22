import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
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

// Hack to rename worker import with corresponding extension 
const replaceWorkerName = (entryFileNames) => {
  const name = 'decoder.worker.js';
  return replace({ 
    preventAssignment: true,
    [name]: `decoder.worker${entryFileNames.slice('[name]'.length)}`,
  });
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
    plugins: () => [
      resolve({ preferBuiltins: true }),
      output.entryFileNames && replaceWorkerName(output.entryFileNames),
    ],
  })
}

const browser = (output) => {
  return bundle({
    output,
    context: 'window',
    plugins: () => [
      resolveEmptyDefault(['fs', 'http', 'https', 'through2']),
      resolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      output.entryFileNames && replaceWorkerName(output.entryFileNames),
    ],
  })
}

export default [
  node({ dir: 'dist-node', format: 'cjs' }),
  node({ dir: 'dist-node', format: 'esm', entryFileNames: '[name].mjs' }),
  browser({ dir: 'dist-browser', format: 'umd', name: 'GeoTIFF' }),
  browser({ dir: 'dist-browser', format: 'esm', entryFileNames: '[name].module.js' }),
].flat();
