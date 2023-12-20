# @recast-navigation/wasm

## 0.16.1

## 0.16.0

## 0.15.1

## 0.15.0

## 0.14.0

## 0.13.3

## 0.13.2

## 0.13.1

### Patch Changes

- 44a77fe: chore: bump webidl-dts-gen from 1.6.0 to 1.7.0

## 0.13.0

### Minor Changes

- 106044a: refactor: consistent naming for JSImplementation structs

## 0.12.1

## 0.12.0

## 0.11.0

### Minor Changes

- ce059e9: refactor: seperate recast-navigation.h and recast-navigation.cpp into multiple files

## 0.10.2

## 0.10.1

## 0.10.0

### Minor Changes

- 0b38fa9: feat: expose off mesh connections functionality

## 0.9.3

### Patch Changes

- 9b8ea41: fix: parcel and react-scripts support

## 0.9.2

## 0.9.1

## 0.9.0

## 0.8.0

## 0.7.3

### Patch Changes

- f42a51b: feat(NavMeshQuery): alloc dtNavMeshQuery once, not every init

## 0.7.2

## 0.7.1

## 0.7.0

### Minor Changes

- 730ab93: feat: remove `TileCacheData` and `NavMeshData`, use `UnsignedCharArray` instead
- 838e1e9: feat: add rcContext implementation for timers and logging
- 838e1e9: feat: rename ChunkyTriMesh to ChunkyTriMeshUtils
- 730ab93: feat: replace `DetourNavMeshBuilder::setSoloNavMeshCreateParams` with `DetourNavMeshBuilder::setPolyMeshCreateParams` and `DetourNavMeshBuilder::setPolyMeshDetailCreateParams`

## 0.6.0

### Minor Changes

- 5e79ceb: feat: remove unused NavPath
- 5e79ceb: feat: remove DebugNavMesh, NavMesh::getDebugNavMesh, Triangle

## 0.5.0

### Minor Changes

- 86554c1: feat(NavMesh): simplify `getPolyArea`, `getOffMeshConnectionsPolyEndPoints`, `addTile` return types
- 86554c1: feat(NavMeshQuery): change methods to have a `options` argument for optional filters, half extents, max sizes

## 0.4.1

### Patch Changes

- 0a1bf73: fix: raw types not resolving, not being included in docs

  Despite the fact that @recast-navigation/wasm is bundled into the core package, it still needs to be listed as a regular dependency so the types are available to the core package.

## 0.4.0

### Minor Changes

- de28866: feat: change `NavMeshGenerator` to two exports, `generateSoloNavMesh` and `generateTiledNavMesh`
- de28866: feat: expose functionality for setting poly areas, poly flags, off mesh connections
- de28866: feat: expose more of dtNavMeshQuery via NavMeshQuery
- de28866: feat: overhaul `Raw` recast and detour bindings
- de28866: feat: implement builtin solo and tiled nav mesh generators in js with `Raw` api
- de28866: feat: expose dtCrowd directly, move majority of crowd logic from c++ to js

### Patch Changes

- de28866: feat: update webidl-dts-gen

## 0.3.0

## 0.2.0

### Minor Changes

- cd82927: feat(NavMeshGenerator): split `generate` into `generateSoloNavMesh` and `generateTiledNavMesh`

## 0.1.2

### Patch Changes

- 273c456: feat: add destroy() methods to classes that need cleanup, address vec3 leaks
- 6635150: fix: was not passing 'cfg.borderSize' to 'rcBuildRegions'

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

## 0.0.5

### Patch Changes

- 1afdacc: feat: enable resizable heap for complex navmesh generation

## 0.0.4

### Patch Changes

- b7de5c1: refactor: move solo navmesh generation into computeSoloNavMesh function
- 098543a: chore: bump webidl-dts-gen from 0.0.3 to 1.1.1

## 0.0.3

## 0.0.2

## 0.0.1

- Initial alpha release!
