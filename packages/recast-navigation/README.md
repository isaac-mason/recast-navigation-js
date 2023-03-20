# recast-navigation

Recast Navigation for the web!

This is the umbrella package for `recast-navigation`. It includes `@recast-navigation/core`, and `@recast-navigation/three` under the `recast-navigation/three` entrypoint.

## Features

- 🌐 ‎ Supports both web and node environments
- 💙 TypeScript support 
- 🙆‍♀️ ‎ Multiple @recast-navigation/core builds (JavaScript, WASM, Inlined WASM)
- 🖇 ‎ [Easy integration with three.js](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation-three)

## Installation

```sh
yarn add recast-navigation
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
