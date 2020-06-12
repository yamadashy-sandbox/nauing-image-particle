

module.exports = {
  mode: process.env.NODE_ENV === "production" ? 'production' : 'development',
  entry: './src/main.ts',

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'babel-loader?cacheDirectory',
      },
    ],
  },
  resolve: {
    extensions: [
      '.ts', '.js',
    ],
  },
};
