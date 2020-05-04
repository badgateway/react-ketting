module.exports = [
  {
    entry: './src/index',
    output: {
      path: __dirname + '/browser',
      filename: 'react-ketting.min.js',
      library: 'ReactKetting',
      libraryTarget: 'umd'
    },

    resolve: {
      extensions: ['.web.ts', '.web.js', '.ts', '.js', '.json'],
      alias: {
        // We need an alternative 'querystring', because the default is not
        // 100% compatible
        querystring: 'querystring-browser'
      }
    },

    devtool: 'source-map',

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'awesome-typescript-loader'
        }
      ]
    },
    node: {
      Buffer: false
    }

  },
  /*
  {
    entry: [
      './test/test-entrypoint',
    ],
    output: {
      path: __dirname + '/browser',
      filename: 'mocha-tests.js'
    },
    resolve: {
      extensions: ['.web.ts', '.web.js', '.ts', '.js', '.json'],
      alias: {
        // We need an alternative 'querystring', because the default is not
        // 100% compatible
        querystring: 'querystring-browser'
      }
    },
    mode: 'production',

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'awesome-typescript-loader'
        }
      ]
    },
    node: {
      Buffer: false
    }

  },*/
];
