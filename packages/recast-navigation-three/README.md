# @recast-navigation/three

Three.js glue for [`recast-navigation`](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation).

## Installation

```bash
> npm install @recast-navigation/three
```

## Usage

### Importing

To use the three.js glue, you can either use the `three` entrypoint in `recast-navigation`:

```ts
import * as RecastNavigationThree from 'recast-navigation/three';
```

Or you can use this package directly:

```ts
import * as RecastNavigationThree from '@recast-navigation/three';
```

### `threeToNavMesh`

As a convenience, this package exports a function for converting an array of `Mesh` objects to a `NavMesh`.

Currently only indexed geometries are supported.

```ts
import * as THREE from 'three';
import { NavMesh } from 'recast-navigation';
import { threeToNavMesh } from 'recast-navigation/three';

const scene = new THREE.Scene();

/* add meshes to the scene */
// ...

const meshes: Mesh[] = [];

scene.traverse((child) => {
  if (child instanceof Mesh) {
    meshes.push(child);
  }
});

/* solo navmesh */
const { navMesh }: NavMesh = threeToNavMesh(meshes, { /* NavMesh config */ }});

/* tiled navmesh */
const { navMesh, tileCache } = threeToNavMesh(meshes, { tileSize: 16 }});
```

### `NavMeshHelper`, `TileCacheHelper`, `CrowdHelper`

```ts
import {
  CrowdHelper,
  NavMeshHelper,
  TileCacheHelper,
} from 'recast-navigation/three';

const navMeshHelper = new NavMeshHelper({ navMesh });
const tileCacheHelper = new TileCacheHelper({ tileCache });
const crowdHelper = new CrowdHelper({ crowd });

const scene = new THREE.Scene();

scene.add(navMeshHelper.navMesh);
scene.add(tileCacheHelper.obstacles);
scene.add(crowdHelper.agents);

navMeshHelper.updateNavMesh();
tileCacheHelper.updateObstacles();
crowdHelper.update();
```

You can optionally provide custom materials to the helpers.

```ts
const navMeshMaterial = new THREE.MeshBasicMaterial({ color: 'red' });
const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 'blue' });
const agentMaterial = new THREE.MeshBasicMaterial({ color: 'red' });

const navMeshHelper = new NavMeshHelper({
  navMesh,
  navMeshMaterial,
});

const tileCacheHelper = new TileCacheHelper({
  tileCache,
  obstacleMaterial,
});

const crowdHelper = new CrowdHelper({
  crowd,
  agentMaterial,
```
