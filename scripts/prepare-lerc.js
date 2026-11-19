import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const wasm = readFileSync(require.resolve('lerc/lerc-wasm.wasm'));
const wasmUrl = `data:application/wasm;base64,${wasm.toString('base64')}`;

// Keep the browser bundle and Blob worker independent of the deployment URL.
const compressionDir = new URL('../dist-module/compression/', import.meta.url);
writeFileSync(new URL('lerc-wasm.js', compressionDir), `export default ${JSON.stringify(wasmUrl)};\n`);
writeFileSync(new URL('lerc-browser.js', compressionDir), `\
import { decode, load } from 'lerc';
import wasmUrl from './lerc-wasm.js';

export default async function loadLerc() {
  await load({ locateFile: () => wasmUrl });
  return decode;
}
`);
