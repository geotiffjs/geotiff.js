/* eslint-disable import/no-commonjs */
/* eslint-disable import/no-extraneous-dependencies */

const path = require('path');
const { babel } = require('@rollup/plugin-babel');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const common = require('@rollup/plugin-commonjs');
const rollup = require('rollup');
const terser = require('@rollup/plugin-terser');
const fse = require('fs-extra');

async function build(input, { minify = true } = {}) {
  const plugins = [
    {
      name: 'remove export let create',
      transform(code, id) {
        if (id !== input) {
          return null;
        }
        return code.replace('export let create;', '');
      },
    },
    common(),
    resolve(),
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
  ];

  if (minify) {
    plugins.push(terser());
  }

  plugins.push({
    name: 'serialize worker and export create function',
    renderChunk(code) {
      return `
        import Worker from 'web-worker';
        export function create() {
          const source = ${JSON.stringify(code)};
          return new Worker(typeof Buffer !== 'undefined' 
            ? 'data:application/javascript;base64,' + Buffer.from(source, 'binary').toString('base64')
            : URL.createObjectURL(new Blob([source], {type: 'application/javascript'})));
        }
      `;
    },
  });

  const bundle = await rollup.rollup({
    input,
    plugins,
    output: { inlineDynamicImports: true },
  });
  const { output } = await bundle.generate({ format: 'es' });

  if (output.length !== 1) {
    throw new Error(`Unexpected output length: ${output.length}`);
  }

  const chunk = output[0];
  if (chunk.isAsset) {
    throw new Error('Expected a chunk, got an asset');
  }

  return chunk;
}

exports.build = build;

/**
 * Creates modules with inlined versions of the worker sources.  These modules
 * export a `create` function for creating a worker.
 */
async function main() {
  const inputDir = path.join(__dirname, '../src/worker');
  const outputDir = path.join(__dirname, '../dist-module/worker');

  await fse.ensureDir(outputDir);

  const entries = await fse.readdir(inputDir);
  for (const entry of entries) {
    if (entry.endsWith('.js')) {
      const chunk = await build(path.join(inputDir, entry));
      await fse.writeFile(path.join(outputDir, entry), chunk.code);
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`${err.stack}\n`);
    process.exit(1);
  });
}
