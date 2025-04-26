/* eslint-disable import/no-extraneous-dependencies */

import baseConfig from './rollup.config.js';

export default {
  ...baseConfig,
  input: 'dist-module/worker/decoder.js',
  output: {
    file: 'dist-module/worker/create.js',
    format: 'module',
    inlineDynamicImports: true,
  },
  plugins: [
    ...baseConfig.plugins,
    {
      name: 'serialize worker and export create function',
      renderChunk(code) {
        return `\
import Worker from 'web-worker';

export default function create() {
  const source = ${JSON.stringify(code)};
  return new Worker(typeof Buffer !== 'undefined' 
    ? 'data:application/javascript;base64,' + Buffer.from(source, 'binary').toString('base64')
    : URL.createObjectURL(new Blob([source], { type: 'application/javascript' })));
}`;
      },
    },
  ],
};
