const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = [

  {

    name: 'api',
    mode: "production", // sets mode to miniied production output, the entry file and the path & filename to output file
    target: 'web',

    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({
        extractComments: false,
      })],
    },
    
    performance: {
      // remove file size warnings from webpack, sets new limit
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },

    module: {
      rules: [
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader'
            }
          ]
        },
        {
          test: /\.twig/,
          type: 'asset/source',
        },
        {
          test: /\.templates\/twig/,
          type: 'asset/source',
        },
        {
          test: /\.templates\/parts\/twig/,
          type: 'asset/source',
        }
      ]
    },

    resolve: {
      alias: {
        components: path.resolve(__dirname, 'src', 'js', 'components')
      },
      extensions: ['.js', '.jsx', '.cjs', '.html'],
    },

    plugins: [
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
      })
    ],

    externals: {
      jquery: 'jQuery'
    },

    entry: {
      feed: './src/js/api.js',
    },

    output: {
      filename: '[name].js',
      path: __dirname + '/public/js/api',
    },
      
  },

  {

    name: 'local',
    mode: "production", // sets mode to miniied production output, the entry file and the path & filename to output file
    target: 'web',

    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({
        extractComments: false,
      })],
    },
    
    performance: {
      // remove file size warnings from webpack, sets new limit
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },

    module: {
      rules: [
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader'
            }
          ]
        },
        {
          test: /\.twig/,
          type: 'asset/source',
        },
        {
          test: /\.templates\/twig/,
          type: 'asset/source',
        },
        {
          test: /\.templates\/parts\/twig/,
          type: 'asset/source',
        }
      ]
    },

    resolve: {
      fallback: {
        "stream": require.resolve("stream-browserify"),
        "timers": require.resolve("timers-browserify"),
        "includes": require.resolve("string.prototype.includes"),
        // "https": require.resolve("https-browserify"),
        // "http": require.resolve("stream-http"),
        // "buffer": require.resolve("buffer/"),
        // "crypto": require.resolve("crypto-browserify"),
        // "util": require.resolve("util/"),
        // "path": require.resolve("path-browserify"),
        // "url": require.resolve("url/")
      },
      alias: {
        components: path.resolve(__dirname, 'src', 'js', 'components')
      },
      extensions: ['.js', '.jsx', '.cjs', '.html'],
    },

    plugins: [
      // Work around for Buffer is undefined: https://github.com/webpack/changelog-v5/issues/10
      // new webpack.ProvidePlugin({
      //   Buffer: ['buffer', 'Buffer'],
      // }),
      // new webpack.ProvidePlugin({
      //   process: 'process/browser',
      // }),
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
      })
    ],

    externals: {
      jquery: 'jQuery'
    },
      
    entry: {
      feed: './src/js/local.js',
    },

    output: {
      filename: '[name].js',
      path: __dirname + '/public/js/local',
    },

  }

];