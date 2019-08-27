import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const TARGET = process.env.TARGET ? process.env.TARGET : 'browser';


const config = (input, file, format, plugins) => ({
  input,
  output: {
    file,
    format,
    name: 'geotiff',
    sourcemap: true,
  },
  watch: {
    include: 'src/**',
    exclude: ['node_modules/**'],
  },
  external: ['buffer', 'fs', 'http', 'https', 'url'],
  plugins: [
    resolve({
      mainFields: ['module', 'main'],
    }),
    commonjs({
      include: ['node_modules/**'],
    }),
    babel({
      exclude: 'node_modules/**',
      include: ['pako/**'],
    }),
    ...plugins,
  ],
});

export default [
  config(`src/entry-${TARGET}.js`, `dist/bundle-${TARGET}.js`, TARGET === 'node' ? 'cjs' : 'umd', []),
  config(`src/entry-${TARGET}.js`, `dist/bundle-${TARGET}.min.js`, TARGET === 'node' ? 'cjs' : 'umd', [terser()]),
];
