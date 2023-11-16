import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import filesize from 'rollup-plugin-filesize';

const commonOutput = {
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

const entrypoint = ({ name, external }) => ({
  input: `./src/${name}.ts`,
  external,
  output: [
    {
      file: `./${name}.mjs`,
      format: 'es',
      ...commonOutput,
    },
    {
      file: `./${name}.cjs`,
      format: 'cjs',
      ...commonOutput,
    },
  ],
  plugins,
});

export default [
  entrypoint({ name: 'index', external: ['@recast-navigation/core'] }),
  entrypoint({ name: 'generators', external: ['@recast-navigation/core'] }),
  entrypoint({
    name: 'three',
    external: ['@recast-navigation/core', '@recast-navigation/three', 'three'],
  }),
];
