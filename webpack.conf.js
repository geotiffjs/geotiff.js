const path = require('path');

module.exports = {
  entry: './src/main',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'geotiff.bundle.js',
    library: 'GeoTIFF',
    libraryTarget: 'umd',
  },

  node: {
    fs: 'empty',
  },

  devServer: {
    host: '0.0.0.0',
    inline: true,
    disableHostCheck: true,
  },

  devtool: 'source-map',
  cache: true,

  // devtool: 'eval-cheap-module-source-map',
};
