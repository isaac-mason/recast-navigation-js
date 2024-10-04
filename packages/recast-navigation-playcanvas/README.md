# @recast-navigation/playcanvas

PlayCanvas nav mesh generation and visualisation helpers for [`recast-navigation`](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation).

## Installation

```bash
> npm install @recast-navigation/playcanas recast-navigation
```

## Usage

### Importing

To import the PlayCanvas glue, you can either use the `playcanvas` entrypoint in `recast-navigation`:

```ts
import { init } from 'recast-navigation'
import { ... } from 'recast-navigation/playcanvas';
```

Or you can use the packages directly:

```ts
import { init } from '@recast-navigation/core'
import { ... } from '@recast-navigation/playcanvas';
```

### Initialization

Before you can use the library, you must initialize it. This is an asynchronous operation.

Calling `init()` after the library has already been initialized will return a promise that resolves immediately.

```ts
import { init } from 'recast-navigation';

await init();
```

### Generating a NavMesh

This package provides convenience functions for generating nav meshes from THREE.Mesh objects.

```ts
import { init } from 'recast-navigation';
import { pcToSoloNavMesh, pcToTiledNavMesh, pcToTileCache } from 'recast-navigation/playcanvas';

/* initialize the library */
await init();



/* generate a solo navmesh */
const { success, navMesh } = pcToSoloNavMesh(meshes, {
  // ... nav mesh generation config ...
}});

/* generate a tiled navmesh */
const { success, navMesh } = pcToTiledNavMesh(meshes, {
  tileSize: 16,
  // ... nav mesh generation config ...
}});

/* generate a tile cache with support for temporary obstacles */
const { success, navMesh, tileCache } = pcToTileCache(meshes, {
  tileSize: 16,
  // ... nav mesh generation config ...
}});
```

### Interacting with a NavMesh

You can documentation for interacting with the generated navmesh in the core library README:

https://github.com/isaac-mason/recast-navigation-js

This library provides helpers that are used in conjunction with the core library.


### Helpers

This package provides helpers for visualizing various recast-navigation objects in three.js.

#### `NavMeshHelper`

```ts
import { NavMeshHelper } from '@recast-navigation/three';

const navMeshHelper = new NavMeshHelper({ navMesh });

this.entity.add(navMeshHelper);

// update the helper when the navmesh changes
navMeshHelper.update();
```

#### `OffMeshConnectionsHelper`

```ts
import { OffMeshConnectionsHelper } from '@recast-navigation/three';

const offMeshConnectionsHelper = new OffMeshConnectionsHelper({
  offMeshConnections,
});

this.entity.add(offMeshConnectionsHelper);
```

#### `TileCacheHelper`

Visualises obstacles in a `TileCache`.

```ts
import { TileCacheHelper } from '@recast-navigation/three';

const tileCacheHelper = new TileCacheHelper({ tileCache });

this.entity.add(tileCacheHelper);

// update the helper after adding or removing obstacles
tileCacheHelper.update();
```

#### `CrowdHelper`

Visualises agents in a `Crowd`.

```ts
import { CrowdHelper } from '@recast-navigation/three';

const crowdHelper = new CrowdHelper({ crowd });

this.entity.add(crowdHelper);

// update the helper after updating the crowd
crowdHelper.update();
```

#### Custom Materials

You can optionally provide custom materials to the helpers.

```ts
// NavMeshHelper
import { StandardMaterial } from 'playcanvas';
const navMeshMaterial = new StandardMaterial();
const navMeshHelper = new NavMeshHelper({
  navMesh,
  navMeshMaterial,
});

// OffMeshConnectionsHelper
const offMeshConnectionEntryCircleMaterial = new StandardMaterial();
const offMeshConnectionExitCircleMaterial = new StandardMaterial();
const offMeshConnectionLineMaterial = new StandardMaterial();

const offMeshConnectionsHelper = new OffMeshConnectionsHelper({
  offMeshConnections,
  entryCircleMaterial: offMeshConnectionEntryCircleMaterial,
  exitCircleMaterial: offMeshConnectionExitCircleMaterial,
  lineMaterial: offMeshConnectionLineMaterial,
});

// TileCacheHelper
const obstacleMaterial = new StandardMaterial();
const tileCacheHelper = new TileCacheHelper({
  tileCache,
  obstacleMaterial,
});

// CrowdHelper
const agentMaterial = new StandardMaterial();
const crowdHelper = new CrowdHelper({
  crowd,
  agentMaterial,
});
```
