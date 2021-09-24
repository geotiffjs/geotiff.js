import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/geotiff.mjs',
  output: {
    file: 'dist-browser/geotiff.js',
    format: 'umd',
    name: 'GeoTIFF',
    sourcemap: true,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
	terser(),
  ],
};
