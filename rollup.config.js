import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'dist-module/geotiff.js',
  output: {
    file: 'dist-browser/geotiff.js',
    format: 'umd',
    name: 'GeoTIFF',
    exports: 'named',
    sourcemap: true,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    terser(),
  ],
};
