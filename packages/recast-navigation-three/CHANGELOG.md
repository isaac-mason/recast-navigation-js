# @recast-navigation/three

## 0.1.2

### Patch Changes

- Updated dependencies [273c456]
  - @recast-navigation/core@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies [b67eb8b]
  - @recast-navigation/core@0.1.1

## 0.1.0

### Minor Changes

- 44c71f0: feat: fix DebugNavMesh winding

### Patch Changes

- Updated dependencies [44c71f0]
- Updated dependencies [44c71f0]
- Updated dependencies [44c71f0]
  - @recast-navigation/core@0.1.0

## 0.0.7

### Patch Changes

- c1e1d38: fix: widen peer dependency version range for `three`
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

- dfe1bcb: feat(three): change getPositionsAndIndices to return typed arrays
- c1e1d38: fix: @recast-navigation/three dependency on three should be a dev dependency
- Updated dependencies [87e768b]
- Updated dependencies [dfe1bcb]
- Updated dependencies [dfe1bcb]
  - @recast-navigation/core@0.0.7

## 0.0.6

### Patch Changes

- Updated dependencies [ad1adaa]
  - @recast-navigation/core@0.0.6

## 0.0.5

### Patch Changes

- @recast-navigation/core@0.0.5

## 0.0.4

### Patch Changes

- 0e68563: feat: remove events, expose update methods on three helpers
- 49d0523: feat(threeToNavMesh): add support for non-indexed geometries
- 14003a7: feat: rename params and properties for helper custom materials
- Updated dependencies [0e68563]
  - @recast-navigation/core@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies [05825a8]
  - @recast-navigation/core@0.0.3

## 0.0.2

### Patch Changes

- 74dfbb4: feat: change `threeToNavMesh` and `threeToNavMeshArgs` to take an array of meshes instead of an object to traverse
  - @recast-navigation/core@0.0.2

## 0.0.1

- Initial alpha release!
