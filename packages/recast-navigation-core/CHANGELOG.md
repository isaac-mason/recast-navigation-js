# @recast-navigation/core

## 0.1.1

### Patch Changes

- b67eb8b: feat: make EXPECTED_LAYERS_PER_TILE and MAX_LAYERS constants configurable

## 0.1.0

### Minor Changes

- 44c71f0: feat: fix DebugNavMesh winding
- 44c71f0: feat: expose dtNavMesh methods and related classes

### Patch Changes

- 44c71f0: feat: add DtStatus constants and utils

## 0.0.7

### Patch Changes

- 87e768b: feat: split NavMesh into multiple classes, update helpers

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

- dfe1bcb: fix: walkable slope angle not affecting generated navmesh
- dfe1bcb: feat: add 'success' field to NavMeshGeneratorResult

## 0.0.6

### Patch Changes

- ad1adaa: feat: improve jsdoc

## 0.0.5

## 0.0.4

### Patch Changes

- 0e68563: feat: remove events, expose update methods on three helpers

## 0.0.3

### Patch Changes

- 05825a8: fix: make `@recast-navigation/wasm` a dev dependency of `@recast-navigation/core`.

  `@recast-navigation/wasm` is inlined in `@recast-navigation/core`'s build output, so it doesn't need to be a dependency of `@recast-navigation/core`.

## 0.0.2

### Patch Changes

- @recast-navigation/wasm@0.0.2

## 0.0.1

- Initial alpha release!
