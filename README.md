# recast-navigation-js

### Recast Navigation for JavaScript!

A WebAssembly port of [Recast Navigation](https://github.com/recastnavigation/recastnavigation), plus other goodies.

> **Warning** This library is still in early development. Versions in the 0.x.x range may have breaking changes.

## Features

- 📐 ‎ NavMesh generation
- 🧭 ‎ Path-finding and spatial reasoning
- 🧑‍🤝‍🧑 ‎ Crowd simulation
- 🌐 ‎ Web and Node support
- 💙 ‎ TypeScript support
- 🖇 ‎ [Easy integration with three.js via @recast-navigation/three](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-three)

## Packages

Functionality is spread across packages in the `@recast-navigation/*` organization, with the `recast-navigation` acting as an umbrella package.

You can choose between picking the scoped packages you need, or using the umbrella `recast-navigation` package, which provides additional entrypoints for specific frameworks and libraries.

All packages ship as ECMAScript modules, and are compatible with Node.js and the browser. An example of using the esm package in a commonjs project can be found in [`./examples/node-cjs-recast-navigation-example`](./examples/node-cjs-recast-navigation-example/)

### [**`recast-navigation`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation)

[![Version](https://img.shields.io/npm/v/recast-navigation)](https://www.npmjs.com/package/recast-navigation)

The umbrella package for `recast-navigation`. Includes `@recast-navigation/core`, and `@recast-navigation/three`.

```bash
> yarn add recast-navigation
```

```ts
import createRecast from 'recast-navigation';
import { NavMesh, Crowd } from 'recast-navigation/three';

const Recast = await createRecast();
```

### [**`@recast-navigation/core`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-core)

[![Version](https://img.shields.io/npm/v/@recast-navigation/core)](https://www.npmjs.com/package/@recast-navigation/core)

The core library!

```bash
> yarn add @recast-navigation/core
```

```ts
import createRecast from '@recast-navigation/core';

const Recast = await createRecast();
```

### [**`@recast-navigation/three`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-three)

[![Version](https://img.shields.io/npm/v/@recast-navigation/three)](https://www.npmjs.com/package/@recast-navigation/three)

A friendly three.js API for recast-navigation.

```bash
> yarn add @recast-navigation/three
```

```ts
import { NavMesh, Crowd } from '@recast-navigation/three';
```

## Apps

### [NavMesh Generator](https://navmesh.isaacmason.com/)

A website for generating navmeshes for your game. Drag 'n' drop your GLTF, fine tune your settings, and download your navmesh!

([source](./apps/navmesh-website/dist/))

## Examples

### [Storybook - @recast-navigation/three](https://example.com/)

Various examples of how to use `@recast-navigation/three`.

([source](./packages/recast-navigation-three/.storybook))

### [Vite Example](https://example.com/)

An example of using `@recast-navigation/core` in a Vite project.

([source](./examples/vite-recast-navigation-three-example/))

### [Three.js + Vite Example](https://example.com/)

An example of using `@recast-navigation/three` with Three.js in a Vite project.

([source](./examples/vite-recast-navigation-three-example/))

## Development

The repository is structured as a monorepo. You will find all published packages inside `./packages`, reference examples in `./examples`, and deployed applications in `./apps`.

Before building, ensure you have the following installed:

- Python 3.10.5
- Emsdk v3.1.34

To build the project, run the following:

```sh
> yarn build
```

## Acknowledgements

- This would not exist without [Recast Navigation](https://github.com/recastnavigation/recastnavigation) itself!
- The WASM build was based on the [Babylon.js Recast Extension](https://github.com/BabylonJS/Extensions/tree/master/recastjs)