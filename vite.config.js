import { defineConfig } from 'vite';
import path from 'path';
import serveStatic from 'serve-static';

/** @type {import('vite').Plugin} */
const resolveWorker = {
  name: 'resolve-decoder-worker',
  configureServer(server) {
    server.middlewares.use((req, _, next) => {
      if (/decoder.worker.mjs$/.test(req.url)) {
        req.url = '/src/decoder.worker.mjs';
      }
      next();
    });
  },
};

/** @type {import('vite').Plugin} */
const serveFixtures = () => {
  const serve = serveStatic('test/data');
  return {
    name: 'serve-fixtures',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (/^\/data\//.test(req.url)) {
          req.url = req.url.replace('/data/', '');
          serve(req, res, next);
        } else {
          next();
        }
      });
    },
  };
};

export default defineConfig({
  build: {
    outDir: 'dist-node',
    minify: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, './src/geotiff.mjs'),
      formats: ['cjs'],
      fileName: () => 'geotiff.js',
    },
    rollupOptions: {
      // All non-relative paths are
      external: [/^[^.\/]|^\.[^.\/]|^\.\.[^\/]/],
    },
  },
  plugins: [resolveWorker, serveFixtures()],
});
