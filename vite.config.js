import { defineConfig } from "vite";
import path from "path";

/** @type {import('vite').Plugin} */
const resolveWorker = {
  name: "resolve-decoder-worker",
  configureServer(server) {
    server.middlewares.use((req, _, next) => {
      if (/decoder.worker.mjs$/.test(req.url)) {
        req.url = "/src/decoder.worker.mjs";
      }
      next();
    });
  },
};

const serveStatic = () => {
  return {
    name: 'serve-static',
  }
}

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "./src/geotiff.mjs"),
      formats: ["cjs"],
    },
    rollupOptions: {
      // All non-relative paths are
      external: [/^[^.\/]|^\.[^.\/]|^\.\.[^\/]/],
    },
  },
  plugins: [
    resolveWorker,
    {
      name: 'serve-fixtures',

    }
  ],
});
