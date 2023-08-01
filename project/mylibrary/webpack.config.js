const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js', 
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[hash:6].js',
    clean:true,
    library: {
      name: 'my',
      type: 'umd',
      export: 'default',
    },
  },
  devServer: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'My Library Demo',
      template: './public/index.html', 
      filename: 'index.html',
      inject: false,
    }),
  ],
};
