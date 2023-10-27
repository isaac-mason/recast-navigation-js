# @recast-navigation/core

## 0.13.3

### Patch Changes

- 9ef585d: feat(Agent): add getters and setters for params
  - @recast-navigation/wasm@0.13.3

## 0.13.2

### Patch Changes

- 63be9aa: fix: make importNavMesh tileCacheMeshProcess argument optional
- f32f79e: feat: add missing 'halfExtents' options to NavMeshQuery methods
  - @recast-navigation/wasm@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies [44a77fe]
  - @recast-navigation/wasm@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies [106044a]
  - @recast-navigation/wasm@0.13.0

## 0.12.1

### Patch Changes

- 63fb772: fix: generateTiledNavMesh buildContext logs weren't logging nverts and npolys correctly
  - @recast-navigation/wasm@0.12.1

## 0.12.0

### Minor Changes

- 6723287: feat: lower maximum memory usage for `generateTiledNavMesh` and `generateTileCache` when `keepIntermediates` is false

  Previously tile intermediates were only released after processing all tiles or on failure. This has been changed so intermediates are released after processing each tile.

- 22c5fe2: feat: remove unnecessary `destroy()` methods
- defdfb2: feat(NavMeshCreateParams): add defaults for off mesh connection params `area` and `flag`
- 257e988: feat: remove FinalizationRegistry functionality

  This was added to catch situations where `destroy()` is not called to free memory. It's current implementation isn't ideal and it adds a fair amount of complexity to the library, so it's being removed for now.

### Patch Changes

- @recast-navigation/wasm@0.12.0

## 0.11.0

### Patch Changes

- 8d8beeb: feat: improve NavMeshQuery jsdoc
- Updated dependencies [ce059e9]
  - @recast-navigation/wasm@0.11.0

## 0.10.2

### Patch Changes

- 0dcaa32: fix: tiled nav mesh generator bounding box expansion
  - @recast-navigation/wasm@0.10.2

## 0.10.1

### Patch Changes

- @recast-navigation/wasm@0.10.1

## 0.10.0

### Minor Changes

- 0b38fa9: feat: expose off mesh connections functionality

### Patch Changes

- Updated dependencies [0b38fa9]
  - @recast-navigation/wasm@0.10.0

## 0.9.3

### Patch Changes

- Updated dependencies [9b8ea41]
  - @recast-navigation/wasm@0.9.3

## 0.9.2

### Patch Changes

- @recast-navigation/wasm@0.9.2

## 0.9.1

### Patch Changes

- @recast-navigation/wasm@0.9.1

## 0.9.0

### Minor Changes

- 82a1bb1: feat: add cjs builds

### Patch Changes

- @recast-navigation/wasm@0.9.0

## 0.8.0

### Minor Changes

- 9c3a8c7: feat(NavMeshQuery): add getPolyHeight

### Patch Changes

- 9c3a8c7: feat: add 'success' to NavMeshQuery method return objects
  - @recast-navigation/wasm@0.8.0

## 0.7.3

### Patch Changes

- Updated dependencies [f42a51b]
  - @recast-navigation/wasm@0.7.3

## 0.7.2

### Patch Changes

- @recast-navigation/wasm@0.7.2

## 0.7.1

### Patch Changes

- @recast-navigation/wasm@0.7.1

## 0.7.0

### Minor Changes

- 730ab93: feat: rename `generateTiledNavMesh` to `generateTileCache`, add `generateTiledNavMesh` that doesn't use `TileCache` and supports large tile sizes
- 559e67d: feat: add CrowdAgent class, move agent methods from Crowd to CrowdAgent
- 730ab93: feat: add `NavMeshParams` class, wrapper over raw `dtNavMeshParams`
- 730ab93: feat: remove `TileCacheData` and `NavMeshData`, use `UnsignedCharArray` instead
- 838e1e9: feat: add rcContext implementation for timers and logging
- 838e1e9: feat: rename dtPoly wrapper class to DetourPoly
- 838e1e9: feat: add more higher-level wrapper classes and functions for nav mesh generation

### Patch Changes

- Updated dependencies [730ab93]
- Updated dependencies [838e1e9]
- Updated dependencies [838e1e9]
- Updated dependencies [730ab93]
  - @recast-navigation/wasm@0.7.0

## 0.6.0

### Minor Changes

- 5e79ceb: feat(NavMesh): remove DebugNavMesh, change navMesh.getDebugNavMesh to return positions and indices arrays

### Patch Changes

- 5e79ceb: fix: debug nav mesh would not cover the whole nav mesh in some cases
- Updated dependencies [5e79ceb]
- Updated dependencies [5e79ceb]
  - @recast-navigation/wasm@0.6.0

## 0.5.0

### Minor Changes

- 820b928: BREAKING CHANGE: `generateSoloNavMesh` and `generateTiledNavMesh` no longer internally reverse input indices, this aligns the required input format with recast navigation c++ library itself (OpenGL conventions)

  The `generateSoloNavMesh` and `generateTiledNavMesh` were inadvertently reversing input indices. The three.js helpers `threeToSoloNavMesh` and `threeToTiledNavMesh` were also reversing indices so front faces would be walkable. This is likely an accidental leftover from using the BabylonJS recast plugin as the starting point of this library. Babylon at its core uses a left handed system.

  If you were previously using the `generateSoloNavMesh` and `generateTiledNavMesh` nav mesh generators, you will need to reverse your input indices to have a counter-clockwise winding order. If you were using the `recast-navigation/three` helpers, you do not need to change anything.

- 86554c1: feat(NavMesh): simplify `getPolyArea`, `getOffMeshConnectionsPolyEndPoints`, `addTile` return types
- 86554c1: feat(NavMeshQuery): change methods to have a `options` argument for optional filters, half extents, max sizes

### Patch Changes

- 5728e0c: feat: add 'type' to nav mesh generator intermediates object, either 'solo' or 'tiled'
- 86554c1: feat: move computePath logic out of cpp, into js using exposed dtNavMeshQuery functionality
- Updated dependencies [86554c1]
- Updated dependencies [86554c1]
  - @recast-navigation/wasm@0.5.0

## 0.4.1

### Patch Changes

- 0a1bf73: fix: raw types not resolving, not being included in docs

  Despite the fact that @recast-navigation/wasm is bundled into the core package, it still needs to be listed as a regular dependency so the types are available to the core package.

- Updated dependencies [0a1bf73]
  - @recast-navigation/wasm@0.4.1

## 0.4.0

### Minor Changes

- de28866: feat: change `NavMeshGenerator` to two exports, `generateSoloNavMesh` and `generateTiledNavMesh`
- de28866: feat: expose functionality for setting poly areas, poly flags, off mesh connections
- de28866: feat: expose more of dtNavMeshQuery via NavMeshQuery
- de28866: feat: overhaul `Raw` recast and detour bindings
- de28866: feat: remove `NavMeshExporter` and `NavMeshImporter` classes, export functions `exportNavMesh` and `importNavMesh`
- de28866: feat: implement builtin solo and tiled nav mesh generators in js with `Raw` api
- de28866: feat: expose dtCrowd directly, move majority of crowd logic from c++ to js
- de28866: feat: remove `emscripten` object, move functionality into `Raw` api

## 0.3.0

## 0.2.0

### Minor Changes

- cd82927: feat(NavMeshGenerator): split `generate` into `generateSoloNavMesh` and `generateTiledNavMesh`

## 0.1.2

### Patch Changes

- 273c456: feat: add destroy() methods to classes that need cleanup, address vec3 leaks

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
