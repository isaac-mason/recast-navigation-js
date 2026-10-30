import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import filesize from 'rollup-plugin-filesize';

const babelOptions = {
  babelrc: false,
  extensions: ['.ts'],
  exclude: '**/node_modules/**',
  babelHelpers: 'bundled',
  // the typescript plugin output references sourcemaps that aren't written to disk
  inputSourceMap: false,
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: '>1%, not dead, not ie 11, not op_mini all',
      },
    ],
    '@babel/preset-typescript',
  ],
};

export default [
  {
    input: './src/index.ts',
    external: ['@recast-navigation/core'],
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
