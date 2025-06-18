# Development

The `recast-navigation-js` repository is structured as a yarn monorepo. You will find all published packages inside `./packages`, reference examples in `./examples`, and deployed applications in `./apps`.


## Packages

Functionality is spread across packages in the `@recast-navigation/*` organization.

The `recast-navigation` package is the umbrella package for core packages, and has entrypoints for `@recast-navigation/core` and `@recast-navigation/generators`.

All packages ship as ECMAScript modules, and are compatible with Node.js and browser environments.

### [**`recast-navigation`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation)

[![Version](https://img.shields.io/npm/v/recast-navigation)](https://www.npmjs.com/package/recast-navigation)

The umbrella package for `recast-navigation`.

```bash
> npm install recast-navigation
```

```ts
import { init } from 'recast-navigation';
import { generateSoloNavMesh } from 'recast-navigation/generators';
```

### [**`@recast-navigation/core`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-core)

[![Version](https://img.shields.io/npm/v/@recast-navigation/core)](https://www.npmjs.com/package/@recast-navigation/core)

The core library!

```bash
> npm install @recast-navigation/core
```

### [**`@recast-navigation/generators`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-generators)

[![Version](https://img.shields.io/npm/v/@recast-navigation/generators)](https://www.npmjs.com/package/@recast-navigation/generators)

NavMesh generator implementations. Use these to get started, and as a basis for your own NavMesh generator.

```bash
> npm install @recast-navigation/generators
```

### [**`@recast-navigation/three`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-three)

[![Version](https://img.shields.io/npm/v/@recast-navigation/three)](https://www.npmjs.com/package/@recast-navigation/three)

Helpers for three.js.

```bash
> npm install @recast-navigation/three
```

### [**`@recast-navigation/playcanvas`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-playcanvas)

[![Version](https://img.shields.io/npm/v/@recast-navigation/playcanvas)](https://www.npmjs.com/package/@recast-navigation/playcanvas)

Helpers for playcanvas.

```bash
> npm install @recast-navigation/playcanvas
```

### [**`@recast-navigation/wasm`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-wasm)

[![Version](https://img.shields.io/npm/v/@recast-navigation/wasm)](https://www.npmjs.com/package/@recast-navigation/wasm)

The WebAssembly build of the Recast and Detour libraries.

You regularly won't need to use this package directly, `@recast-navigation/core` uses it internally.

```bash
> npm install @recast-navigation/wasm
```

## Apps

### [NavMesh Generator](https://navmesh.isaacmason.com/)

A website for generating navmeshes for your game. Drag 'n' drop your GLTF, fine tune your settings, and download your navmesh!

([source](./apps/navmesh-website/))

## Prerequisites

### Node Installation

**This project uses node 22.**

If you don't already use a node version manager. Give nvm a try if you don't already have one.

https://github.com/nvm-sh/nvm

### Yarn Installation

**This project uses yarn 4.**

If you have Corepack enabled, you should be able to use this project's yarn version without doing anything special. If you don't have Corepack enabled, you can enable it by running the following:

```sh
> corepack enable
```

### Python Installation

**This project uses Python 3**

A python version manager will make your life easier. Give pyenv a try if you don't already have one.

https://github.com/pyenv/pyenv

### Emscripten Installation

**This project uses Emsdk v4.0.10.**

On mac / linux, you can install emscripten with the following instructions.

```sh
# enter a directory you're happy to put emscripten in
cd ~/Development

# Clone the emsdk repo
git clone https://github.com/emscripten-core/emsdk.git

# Enter that directory
cd emsdk

# Download and install recast-navigation's required version of emscripten
./emsdk install 4.0.10

# Activate the emsdk version you just installed
./emsdk activate 4.0.10

# Activate PATH and other environment variables in the current terminal
source ./emsdk_env.sh
```

For the latest installation instructions, as well as windows installation instructions, see the emscripten website: https://emscripten.org/docs/getting_started/downloads.html

After you have installed emscripten, you can sanity check that you have the correct version installed by running:

```sh
> emcc --version
```

## Building

Once you have the above installed, run the following to install dependencies and build all packages:

```sh
> yarn install
> yarn build
```

To run the storybooks, run the following:

```sh
cd packages/recast-navigation
yarn storybook
```

## Debugging WASM

In order to debug @recast-navigation/wasm, you must build the library in debug mode, then rebuild @recast-navigation/core:

```ts
(cd packages/recast-navigation-wasm && yarn build:debug)
(cd packages/recast-navigtion-core && yarn build)
```

You can then follow these instructions to setup chrome for debugging WASM: https://developer.chrome.com/blog/wasm-debugging-2020/