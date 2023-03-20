# recast-navigation-js

Recast Navigation for the web!

## Features

- 🌐 ‎ Supports both web and node environments
- 💙 TypeScript support 
- 🙆‍♀️ ‎ Multiple @recast-navigation/core builds (JavaScript, WASM, Inlined WASM)
- 🖇 ‎ [Easy integration with three.js](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-three)

## Packages

### [**`recast-navigation`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation)

[![Version](https://img.shields.io/npm/v/recast-navigation)](https://www.npmjs.com/package/recast-navigation)

The umbrella package for `recast-navigation`. Includes `@recast-navigation/core`, and `@recast-navigation/three` under the `recast-navigation/three` entrypoint.

```bash
> yarn add recast-navigation
```

### [**`@recast-navigation/core`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-core)

[![Version](https://img.shields.io/npm/v/@recast-navigation/core)](https://www.npmjs.com/package/@recast-navigation/core)

The core library!

```bash
> yarn add @recast-navigation/core
```

### [**`@recast-navigation/three`**](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-three)

[![Version](https://img.shields.io/npm/v/@recast-navigation/three)](https://www.npmjs.com/package/@recast-navigation/three)

A Three.js integration for `@recast-navigation/core`.

```bash
> yarn add @recast-navigation/three
```

## Example

```ts
import createRecast from "recast-navigation";
import { BoxGeometry, Mesh } from "three";

const Recast = await createRecast();

const navMesh = new Recast.NavMesh();

const ground = new Mesh(new BoxGeometry(5, 0.5, 5));

const config = new Recast.rcConfig();

config.borderSize = 0;
config.tileSize = 0;
config.cs = 0.2;
config.ch = 0.2;
config.walkableSlopeAngle = 35;
config.walkableHeight = 1;
config.walkableClimb = 1;
config.walkableRadius = 1;
config.maxEdgeLen = 12;
config.maxSimplificationError = 1.3;
config.minRegionArea = 8;
config.mergeRegionArea = 20;
config.maxVertsPerPoly = 6;
config.detailSampleDist = 6;
config.detailSampleMaxError = 1;

const positions = ground.geometry.attributes.position.array;
const indices = ground.geometry.index.array;
const offset = positions.length / 3;

navMesh.build(positions, offset, indices, indices.length, config);

const closestPoint = navMesh.getClosestPoint(new Recast.Vec3(2, 1, 2));

console.log(closestPoint.x, closestPoint.y, closestPoint.z);
```
