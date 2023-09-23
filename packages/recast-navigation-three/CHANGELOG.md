# @recast-navigation/three

## 0.9.1

### Patch Changes

- @recast-navigation/core@0.9.1

## 0.9.0

### Minor Changes

- 82a1bb1: feat: add cjs builds

### Patch Changes

- Updated dependencies [82a1bb1]
  - @recast-navigation/core@0.9.0

## 0.8.0

### Minor Changes

- 751e029: feat: change CrowdHelper agent geometry from capsule to cylinder

### Patch Changes

- Updated dependencies [9c3a8c7]
- Updated dependencies [9c3a8c7]
  - @recast-navigation/core@0.8.0

## 0.7.3

### Patch Changes

- @recast-navigation/core@0.7.3

## 0.7.2

### Patch Changes

- @recast-navigation/core@0.7.2

## 0.7.1

### Patch Changes

- 089a942: fix: three and @types/three peer deps
  - @recast-navigation/core@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [730ab93]
- Updated dependencies [559e67d]
- Updated dependencies [730ab93]
- Updated dependencies [730ab93]
- Updated dependencies [838e1e9]
- Updated dependencies [838e1e9]
- Updated dependencies [838e1e9]
  - @recast-navigation/core@0.7.0

## 0.6.0

### Minor Changes

- 5e79ceb: feat(HeightfieldHelper): call update on construction

### Patch Changes

- Updated dependencies [5e79ceb]
- Updated dependencies [5e79ceb]
  - @recast-navigation/core@0.6.0

## 0.5.0

### Minor Changes

- 820b928: BREAKING CHANGE: `generateSoloNavMesh` and `generateTiledNavMesh` no longer internally reverse input indices, this aligns the required input format with recast navigation c++ library itself (OpenGL conventions)

  The `generateSoloNavMesh` and `generateTiledNavMesh` were inadvertently reversing input indices. The three.js helpers `threeToSoloNavMesh` and `threeToTiledNavMesh` were also reversing indices so front faces would be walkable. This is likely an accidental leftover from using the BabylonJS recast plugin as the starting point of this library. Babylon at its core uses a left handed system.

  If you were previously using the `generateSoloNavMesh` and `generateTiledNavMesh` nav mesh generators, you will need to reverse your input indices to have a counter-clockwise winding order. If you were using the `recast-navigation/three` helpers, you do not need to change anything.

- 820b928: fix: getPositionsAndIndices not merging index geometries correctly

### Patch Changes

- Updated dependencies [5728e0c]
- Updated dependencies [820b928]
- Updated dependencies [86554c1]
- Updated dependencies [86554c1]
- Updated dependencies [86554c1]
  - @recast-navigation/core@0.5.0

## 0.4.1

### Patch Changes

- Updated dependencies [0a1bf73]
  - @recast-navigation/core@0.4.1

## 0.4.0

### Minor Changes

- de28866: feat: helpers now extend THREE.Object3D and can be directly added to a THREE.Scene
- de28866: feat: overhaul `Raw` recast and detour bindings
- de28866: feat: rename all helper update methods to `update`, rather than having varying method names

### Patch Changes

- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
  - @recast-navigation/core@0.4.0

## 0.3.0

### Minor Changes

- 45d09df: refactor(HeightfieldHelper): rename `heightfield` to `heightfields`

### Patch Changes

- @recast-navigation/core@0.3.0

## 0.2.0

### Minor Changes

- cd82927: feat: split threeToNavMesh into threeToSoloNavMesh and threeToTiledNavMesh

### Patch Changes

- Updated dependencies [cd82927]
  - @recast-navigation/core@0.2.0

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
