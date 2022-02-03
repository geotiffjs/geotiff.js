import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
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
    babel({
      babelHelpers: 'runtime',
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            targets: 'last 2 versions, not dead',
          },
        ],
      ],
      plugins: ['@babel/plugin-transform-runtime'],
    }),
    terser(),
  ],
};
