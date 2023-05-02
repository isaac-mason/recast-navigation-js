---
'@recast-navigation/core': patch
'@recast-navigation/three': patch
'@recast-navigation/wasm': patch
---

feat: split NavMesh into multiple classes, update helpers

### New Core Classes

Functionality in the `NavMesh` class has been split into multiple classes that more closely mirror the recastnavigation api.
- `TileCache`
  - Manages tiles and obstacles. Only used for tiled navmeshes.
- `NavMeshQuery`
  - Provides methods for querying a navmesh.
- `NavMeshExporter`
  - Methods for exporting a navmesh to a Uint8Array.
- `NavMeshImporter`
  - Methods for importing a navmesh from a Uint8Array.
- `NavMeshGenerator`
  - Methods for generating solo and tiled navmeshes.

### Changes to three.js utils and helpers

The usage for `threeToNavMesh` has changed slightly to include the TileCache when generating a tiled navmesh.

```ts
/* solo navmesh */
const { navMesh } = threeToNavMesh(meshes);

/* tiled navmesh */
const { navMesh, tileCache } = threeToNavMesh(meshes, { tileSize: 16 });
```

The `threeToNavMeshArgs` function has been renamed to `getPositionsAndIndices`.

The helpers have also been updated to align with the new core classes:
- `TileCacheHelper`
  - New helper for visualising obstacles in a `TileCache`
- `NavMeshHelper`
  - `updateObstacles` has been moved to `TileCacheHelper`
- `CrowdHelper`
  - `update` has been renamed to `updateAgents`, following the naming convention of the other helpers