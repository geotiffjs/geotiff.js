import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins';
import butternut from 'rollup-plugin-butternut';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs',
    sourcemap: 'dist/bundle.sourcemap'
  },
  watch: {
    include: 'src/**',
    exclude: ['node_modules/**'],
  },
  plugins: [
    builtins(), // FLags that some of the import statements are NodeJS built-ins
    resolve(),
    commonjs({
      include: 'node_modules/**',
    }),
    babel({
      exclude: 'node_modules/**',
      include: 'pako/**'
    }),
    butternut(), // Minification
  ],
}
