# @recast-navigation/playcanvas

PlayCanvas nav mesh generation and visualisation helpers for [`recast-navigation`](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation).

## Installation

```bash
> npm install @recast-navigation/playcanvas recast-navigation
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

This package provides convenience functions for generating nav meshes from PlayCanvas MeshInstance objects.

```ts
import { init } from 'recast-navigation';
import { pcToSoloNavMesh, pcToTiledNavMesh, pcToTileCache } from 'recast-navigation/playcanvas';

/* initialize the library */
await init();

/* generate a solo navmesh */
const { success, navMesh } = pcToSoloNavMesh(meshInstances, {
  // ... nav mesh generation config ...
}});

/* generate a tiled navmesh */
const { success, navMesh } = pcToTiledNavMesh(meshInstances, {
  tileSize: 16,
  // ... nav mesh generation config ...
}});

/* generate a tile cache with support for temporary obstacles */
const { success, navMesh, tileCache } = pcToTileCache(meshInstances, {
  tileSize: 16,
  // ... nav mesh generation config ...
}});
```

### Interacting with a NavMesh

You can documentation for interacting with the generated navmesh in the core library README:

https://github.com/isaac-mason/recast-navigation-js

This library provides helpers that are used in conjunction with the core library.

### Helpers

This package provides helpers for visualizing various recast-navigation objects in PlayCanvas.

#### `NavMeshHelper`

```ts
import { NavMeshHelper } from '@recast-navigation/playcanvas';

const navMeshHelper = new NavMeshHelper(navMesh, graphicsDevice);

this.entity.addChild(navMeshHelper);

// update the helper when the navmesh changes
navMeshHelper.update();
```

#### `TileCacheHelper`

Visualises obstacles in a `TileCache`.

```ts
import { TileCacheHelper } from '@recast-navigation/playcanvas';

const tileCacheHelper = new TileCacheHelper(tileCache);

this.entity.addChild(tileCacheHelper);

// update the helper after adding or removing obstacles
tileCacheHelper.update();
```

#### `CrowdHelper`

Visualises agents in a `Crowd`.

```ts
import { CrowdHelper } from '@recast-navigation/playcanvas';

const crowdHelper = new CrowdHelper(crowd, graphicsDevice);

this.entity.addChild(crowdHelper);

// update the helper after updating the crowd
crowdHelper.update();
```
