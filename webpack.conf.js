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

  devtool: 'eval-cheap-module-source-map',
};
