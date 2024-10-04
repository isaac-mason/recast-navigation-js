import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import filesize from 'rollup-plugin-filesize';

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

const plugins = [
  terser(),
  resolve(),
  commonjs(),
  typescript({
    tsconfig: path.resolve(__dirname, `tsconfig.json`),
    emitDeclarationOnly: true,
  }),
  babel(babelOptions),
  filesize(),
];

const entrypoint = ({ name, external }) => ({
  input: `./src/${name}.ts`,
  external,
  output: [
    {
      file: `./${name}.mjs`,
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
  ],
  plugins,
});

export default [
  entrypoint({ name: 'index', external: ['@recast-navigation/core'] }),
  entrypoint({
    name: 'generators',
    external: ['@recast-navigation/core', '@recast-navigation/generators'],
  }),
];
