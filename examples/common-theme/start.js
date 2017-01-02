"use strict";
const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const subImport = require('postcss-import-sub');
const autoprefixer = require('autoprefixer');
const postCssSimpleVars = require('postcss-simple-vars');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const openBrowser = require('react-dev-utils/openBrowser');
const inquirer = require('inquirer');


process.env.NODE_ENV = 'development';
const DEFAULT_PORT = process.env.PORT || 3000;
const paths = {
  public: '/',
  appPublic: path.resolve(process.cwd(), 'public')
};

function createConfig(theme) {
  return {
    performance: {
      hints: false
    },
    entry: [
      path.resolve(process.cwd(), 'src/index.js')
    ],
    output: {
      path: path.resolve(process.cwd(), './build'),
      pathinfo: true,
      filename: 'static/js/bundle.js',
      publicPath: paths.public
    },
    resolve: {
      alias: {
        "mycomponents": path.resolve(process.cwd(), 'mycomponents')
      }
    },
    module: {
      rules: [
        {
          test: /\.(js)$/,
          include: /(src|components)/,
          use: 'babel-loader',
          query: {
            cacheDirectory: true
          }
        },
        {
          exclude: [
            /\.html$/,
            /\.(js|jsx)$/,
            /\.css$/,
            /\.json$/,
            /\.svg$/
          ],
          use: 'url-loader',
          query: {
            limit: 10000,
            name: 'static/media/[name].[hash:8].[ext]'
          }
        },
        {
          test: /\.css$/,
          include: /(components)/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1, // Postcss compatibility
                modules: true, // Enable css-modules
                localIdentName: '[folder]__[local]___[hash:base64:5]' // Mask for class names
              }
            },
            {
              loader: 'postcss-loader'
            }
          ]
        }
      ]
    },
    plugins: [
      new InterpolateHtmlPlugin({
        PUBLIC_URL: 'public'
      }),
      new HtmlWebpackPlugin({
        inject: true,
        template: 'public/index.html',
      }),
      new webpack.HotModuleReplacementPlugin(),
      new ExtractTextPlugin('static/css/[name].css'),
      new webpack.LoaderOptionsPlugin({
        test: /\.css$/,
        debug: true,
        options: {
          context: __dirname,
          postcss: [
            subImport([
              {
                module: /theme\.css$/,
                to: "<root>/themes/"+theme+"/index.css",
                append: true
              }
            ]),
            postCssSimpleVars,
            autoprefixer({
              browsers: [
                '>1%',
                'last 4 versions',
                'Firefox ESR',
                'not ie < 9', // React doesn't support IE8 anyway
              ]
            })
          ]
        }
      })
    ]
  };
}

function runDev(webpackConf) {
  const compiler = webpack(webpackConf);

  const devServer = new WebpackDevServer(compiler, {
    compress: false,
    clientLogLevel: 'none',
    contentBase: paths.appPublic,
    hot: true,
    publicPath: webpackConf.output.publicPath,
    watchOptions: {
      ignored: /node_modules/
    },
    quiet: true
  });

  // compiler.run((err, stats) => {
  //   console.log('DONE');
  // });
  // .plugin('done', function(stats) {
  //   console.log('DONE');
  // });

  devServer.listen(DEFAULT_PORT, (err, result) => {
    if (err) {
      return console.log(err);
    }
    clearConsole();
    console.log(chalk.cyan('Starting the development server...'));
    console.log();

    openBrowser('http://localhost:' + DEFAULT_PORT + '/');
  });
}

inquirer.prompt([
  {
    name: "theme",
    type: 'list',
    message: "Select theme",
    choices: ['default','purple','rainbow'],
    default: 'default'
  }
]).then(function(answers) {
  runDev(createConfig(answers.theme));
});
