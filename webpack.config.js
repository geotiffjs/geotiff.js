const path = require('path');
const sendRanges = require('send-ranges');
const fs = require('fs');
const fse = require('fs-extra');

const isProduction = (process.env.NODE_ENV === 'production');

async function retrieveFile(request) {
  const filePath = path.join('test', request.path);
  if (!/\.tif(f?)$/.test(filePath)) {
    return null; // Falsey values will call the next handler in line
  }
  const getStream = range => fs.createReadStream(filePath, range);
  const type = 'image/tiff';
  const stats = await fse.stat(filePath);

  return { getStream, type, size: stats.size };
}

module.exports = {
  entry: './src/main',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'geotiff.bundle.min.js' : 'geotiff.bundle.js',
    library: 'GeoTIFF',
    libraryTarget: 'umd',
  },

  module: {
    rules: [
      {
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: {
            name: isProduction ? '[hash].decoder.worker.min.js' : '[hash].decoder.worker.js',
            inline: true,
            fallback: true,
          },
        },
      }, {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },

  node: {
    fs: 'empty',
    buffer: 'empty',
    http: 'empty',
  },

  devServer: {
    host: '0.0.0.0',
    port: 8090,
    inline: true,
    disableHostCheck: true,
    watchContentBase: true,
    overlay: {
      warnings: true,
      errors: true,
    },
    setup(app) {
      app.use(sendRanges(retrieveFile, { maxRanges: 10 }));
    },
  },
  cache: true,
};
