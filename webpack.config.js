const webpack = require('webpack');

const common = {
  entry: (process.env.RECURSIVE ? {
    recursive: './src/recursive.js'
  } : {
    index: './src/index.js'
  }),
  module: {
    loaders: [
      { 
        test: /\.js$/, 
        loaders: ['babel-loader'], 
        include: __dirname + '/src'
      }
    ]
  },
  externals: {
    react: 'React'
  }
};

// Build for npm package
// Parent project should run any minification plugins
const library = {
  output: {
    path: __dirname,
    filename: '[name].js',
    library: 'ReactComponentData',
    libraryTarget: 'umd'
  }
}

// Build for script tag
const script = {
  output: {
    path: __dirname + '/dist/',
    filename: '[name].js',
    library: 'ReactComponentData',
    libraryTarget: 'umd'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin()
  ]
}

let config;

if (process.env.TYPE === 'library'){
  config = Object.assign(common, library);
}else
if (process.env.TYPE === 'script'){
  config = Object.assign(common, script);
}

module.exports = config;
