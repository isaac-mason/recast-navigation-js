'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var babel = require('@rollup/plugin-babel');
var commonjs = require('@rollup/plugin-commonjs');
var resolve = require('@rollup/plugin-node-resolve');
var typescript = require('@rollup/plugin-typescript');
var path = require('path');
var filesize = require('rollup-plugin-filesize');

const babelOptions = {
  babelrc: false,
  extensions: ['.ts'],
  exclude: '**/node_modules/**',
  babelHelpers: 'bundled',
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: false,
        targets: '>1%, not dead, not ie 11, not op_mini all',
      },
    ],
    '@babel/preset-typescript',
  ],
};

var rollup_config = [
  {
    input: './src/index.ts',
    external: ['@recast-navigation/wasm'],
    output: [
      {
        file: 'dist/index.mjs',
        format: 'es',
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        emitDeclarationOnly: true,
      }),
      babel(babelOptions),
      filesize(),
    ],
  },
];

exports.default = rollup_config;
