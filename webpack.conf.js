const path = require('path');

module.exports = {
  entry: './src/main',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'geotiff.bundle.js',
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
            inline: true,
          },
        },
      },
    ],
  },

  node: {
    fs: 'empty',
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
  },

  devtool: 'source-map',
  cache: true,
};
