'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var commonjs = require('@rollup/plugin-commonjs');
var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var terser = require('@rollup/plugin-terser');
var typescript = require('@rollup/plugin-typescript');
var path = require('path');
var filesize = require('rollup-plugin-filesize');

var rollup_config = [
  {
    input: `./src/index.ts`,
    external: ['@recast-navigation/core', 'three'],
    output: [
      {
        file: `dist/index.es.js`,
        format: 'es',
        sourcemap: true,
        exports: 'named',
      },
    ],
    plugins: [
      terser(),
      pluginNodeResolve.nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: path.resolve(__dirname, `tsconfig.json`),
        sourceMap: true,
        inlineSources: true,
      }),
      filesize(),
    ],
  },
];

exports.default = rollup_config;
