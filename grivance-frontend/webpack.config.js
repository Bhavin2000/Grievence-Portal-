const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      // Auth pages
      'login': './src/pages/auth/login.js',
      'register': './src/pages/auth/register.js',
      'forgot-password': './src/pages/auth/forgot-password.js',
      'new-password': './src/pages/auth/new-password.js',
      
      // Role-specific pages
      'admin-portal': './src/pages/admin/admin-portal.js',
      'hod-page': './src/pages/hod/hod-page.js',
      'principal-dashboard': './src/pages/principal/principal-dashboard.js',
      'student-home': './src/pages/student/student-home.js',
      'teachers-portal': './src/pages/teacher/teachers-portal.js',
      
      // Common pages
      'landing-page': './src/pages/common/landing-page.js'
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash].min.js' : 'js/[name].js',
      chunkFilename: isProduction ? 'js/[name].[contenthash].chunk.js' : 'js/[name].chunk.js',
      clean: true,
      publicPath: '/'
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name].[hash][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash][ext]'
          }
        }
      ]
    },

    plugins: [
      new CleanWebpackPlugin(),

      // Generate HTML files for each page
      new HtmlWebpackPlugin({
        template: './src/pages/auth/login.html',
        filename: 'login.html',
        chunks: ['login'],
        minify: isProduction
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/auth/register.html',
        filename: 'register.html',
        chunks: ['register'],
        minify: isProduction
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/auth/forgot-password.html',
        filename: 'forgot-password.html',
        chunks: ['forgot-password'],
        minify: isProduction
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/auth/new-password-page.html',
        filename: 'new-password.html',
        chunks: ['new-password'],
        minify: isProduction
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/admin/admin-portal.html',
        filename: 'admin-portal.html',
        chunks: ['admin-portal'],
        minify: isProduction
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/hod/hod-page.html',
        filename: 'hod-page.html',
        chunks: ['hod-page'],
        minify: isProduction
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/principal/principal-dashboard.html',
        filename: 'principal-dashboard.html',
        chunks: ['principal-dashboard'],
        minify: isProduction
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/student/student-home.html',
        filename: 'student-home.html',
        chunks: ['student-home'],
        minify: isProduction
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/teacher/teachers-portal.html',
        filename: 'teachers-portal.html',
        chunks: ['teachers-portal'],
        minify: isProduction
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/auth/login.html',
        filename: 'index.html',
        chunks: ['login'],
        minify: isProduction
      }),

      // Extract CSS in production
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash].css',
          chunkFilename: 'css/[name].[contenthash].chunk.css'
        })
      ] : []),

      // Copy static assets
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'assets',
            to: 'assets',
            noErrorOnMissing: true
          }
        ]
      })
    ],

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction
            }
          }
        }),
        new CssMinimizerPlugin()
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          shared: {
            test: /[\\/]src[\\/]shared[\\/]/,
            name: 'shared-utils',
            chunks: 'all',
            minChunks: 2,
            enforce: true
          },
          common: {
            name: 'common',
            chunks: 'all',
            minChunks: 2,
            enforce: true
          }
        }
      }
    },

    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true
    },

    devtool: isProduction ? 'source-map' : 'inline-source-map',

    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@utils': path.resolve(__dirname, './src/shared/utils')
      }
    }
  };
};