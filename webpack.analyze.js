const merge = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const analyzeConfig = {
    plugins: [
        new BundleAnalyzerPlugin({
            analyzerHost: process.env.ANALYZER_HOST || "127.0.0.1"
        })
    ]
};

const config = require('./webpack.config.js');

module.exports = merge(config, analyzeConfig);
