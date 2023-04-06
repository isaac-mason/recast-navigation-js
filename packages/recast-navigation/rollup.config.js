import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import filesize from 'rollup-plugin-filesize';

const commonOutput = {
  format: 'es',
  sourcemap: true,
  exports: 'named',
};

const plugins = [
  terser(),
  nodeResolve(),
  commonjs(),
  typescript({
    tsconfig: path.resolve(__dirname, `tsconfig.json`),
    sourceMap: true,
    inlineSources: true,
  }),
  filesize(),
];

export default [
  {
    input: `./src/index.ts`,
    external: ['@recast-navigation/core'],
    output: [
      {
        file: `./index.js`,
        ...commonOutput,
      },
    ],
    plugins,
  },
  {
    input: `./src/three.ts`,
    external: ['@recast-navigation/core', '@recast-navigation/three', 'three'],
    output: [
      {
        file: `./three.js`,
        ...commonOutput,
      },
    ],
    plugins,
  },
];
