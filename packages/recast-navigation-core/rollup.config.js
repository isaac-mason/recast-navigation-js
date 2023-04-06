import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import filesize from 'rollup-plugin-filesize';

export default [
  {
    input: `./src/index.ts`,
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
      nodeResolve(),
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
