const path = require('path');
const ThreadsPlugin = require('threads-plugin');
const isProduction = (process.env.NODE_ENV === 'production');

module.exports = {
  entry: './src/main',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'geotiff.bundle.min.js' : 'geotiff.bundle.js',
    library: 'GeoTIFF',
    libraryTarget: 'umd',
  },

  plugins: [
    new ThreadsPlugin()
  ],

  module: {
    rules: [
      {
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
  },
  cache: true,
};