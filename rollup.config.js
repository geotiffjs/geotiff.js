import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import butternut from 'rollup-plugin-butternut';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'umd',
    name: 'GeoTIFF',
    sourcemap: 'dist/bundle.js.map'
  },
  watch: {
    include: 'src/**',
    exclude: ['node_modules/**'],
  },
  plugins: [
    builtins(), // FLags that some of the import statements are NodeJS built-ins
    globals(),
    resolve(),
    commonjs({
      include: 'node_modules/**',
    }),
    babel({
      exclude: 'node_modules/**',
      include: 'pako/**'
    }),
  ],
}
