import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import filesize from 'rollup-plugin-filesize';

export default [
  {
    input: `./src/index.ts`,
    external: ['@recast-navigation/core', 'three'],
    output: [
      {
        file: `dist/index.mjs`,
        format: 'es',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: `dist/index.cjs`,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      }
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
