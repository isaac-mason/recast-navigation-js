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
import { ... } from 'recast-navigation/three';
```

Or you can use this package directly:

```ts
import { ... } from '@recast-navigation/three';
```

### Generating a NavMesh

This package provides convenience functions for generating nav meshes from THREE.Mesh objects.

```ts
import { threeToSoloNavMesh, threeToTiledNavMesh, threeToTileCache } from 'recast-navigation/three';
import * as THREE from 'three';

const scene = new THREE.Scene();

/* add meshes to the scene */
// ...

const meshes: THREE.Mesh[] = [];

scene.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    meshes.push(child);
  }
});

/* solo navmesh */
const { navMesh } = threeToSoloNavMesh(meshes, {
  // ... nav mesh generation config ...
}});

/* tiled navmesh */
const { navMesh } = threeToTiledNavMesh(meshes, {
  tileSize: 16,
  // ... nav mesh generation config ...
}});

/* tiled navmesh */
const { navMesh, tileCache } = threeToTileCache(meshes, {
  tileSize: 16,
  // ... nav mesh generation config ...
}});
```

### Helpers

This package provides helpers for visualizing various recast-navigation objects in three.js.

#### `NavMeshHelper`

```ts
import { NavMeshHelper } from 'recast-navigation/three';

const navMeshHelper = new NavMeshHelper({ navMesh });

scene.add(navMeshHelper);

// update the helper when the navmesh changes
navMeshHelper.update();
```

#### `TileCacheHelper`

Visualises obstacles in a `TileCache`.

```ts
import { TileCacheHelper } from 'recast-navigation/three';

const tileCacheHelper = new TileCacheHelper({ tileCache });

scene.add(tileCacheHelper);

// update the helper after adding or removing obstacles
tileCacheHelper.update();
```

#### `CrowdHelper`

Visualises agents in a `Crowd`.

```ts
import { CrowdHelper } from 'recast-navigation/three';

const crowdHelper = new CrowdHelper({ crowd });

scene.add(crowdHelper);

// update the helper after updating the crowd
crowdHelper.update();
```

#### Custom Materials

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
