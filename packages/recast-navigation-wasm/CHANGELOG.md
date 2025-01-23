# @recast-navigation/wasm

## 0.38.5

### Patch Changes

- Ignore collisions from neighbours traverse initial segment of offMeshConnection. We want to avoid jerk nearby npcs stuck inside corners.

## 0.38.4

### Patch Changes

- Try fix previous version e.g. dependencies of 'three' package should have same version

## 0.38.3

### Patch Changes

- Sync with feat/expose-off-mesh-anim i.e. compute neighbours in offMeshConnections too

## 0.38.0

## 0.37.0

## 0.36.1

### Patch Changes

- c726f1a: fix: memory cleanup for some result classes and structs

## 0.36.0

## 0.35.2

## 0.35.1

## 0.35.0

## 0.34.0

## 0.33.0

## 0.32.0

## 0.31.1

## 0.31.0

### Minor Changes

- 225a983: feat: add support for getting/setting random seed used by NavMeshQuery
- 29e6ebc: feat: use c++ 17
- e2a7112: feat: bump emsdk from 3.1.58 to 3.1.61

## 0.30.0

## 0.29.2

## 0.29.1

### Patch Changes

- b7140ef: feat: remove unused Log util

## 0.29.0

## 0.28.0

### Minor Changes

- 365e0aa: fix: change findPolysAroundCircle resultCost to be a FloatArray, not a FloatRef

## 0.27.0

### Patch Changes

- 3e73069: feat: bump emsdk from 3.1.44 to 3.1.58

## 0.26.0

## 0.25.0

### Minor Changes

- db8f331: feat: expose duDebugDraw recast and detour debug drawing utilities

## 0.24.1

## 0.24.0

### Minor Changes

- 4b1fcf8: feat(NavMeshQuery): replace getClosestPoint with improved findClosestPoint

  Renamed `getClosestPoint` to `findClosestPoint` to align naming with other methods.

  `findClosestPoint` now returns a `success` and `status` property Previously if the operation was unsuccessful, a zero vector was returned. Now, the `success` property will be `false` and the `status` property will contain a dtStatus describing the reason for failure.

## 0.23.0

## 0.22.0

## 0.21.0

### Minor Changes

- d8a6280: feat: expose dtNavMesh `decodePolyId` and `encodePolyId`

## 0.20.0

## 0.19.0

### Minor Changes

- d490a5c: feat(TileCache): expose detour result when adding and removing obstacles

  Previously `addBoxObstacle` and `addCylinderObstacle` would return the obstacle object. Now they return a result object with `success` and `status` properties explaining the result of the operation, and a `obstacle` property containing the obstacle object if the operation was successful.

  ```ts
  const obstacle = tileCache.addBoxObstacle(position, extent, angle);
  ```

  ```ts
  const { success, status, obstacle } = tileCache.addBoxObstacle(
    position,
    extent,
    angle
  );
  ```

  Additionally `removeObstacle` now returns a result object with `success` and `status` properties.

  ```ts
  const { success, status } = tileCache.removeObstacle(obstacle);
  ```

## 0.18.2

## 0.18.1

### Patch Changes

- 236b810: feat: bump webidl-dts-gen from 1.10.0 to 1.11.0

## 0.18.0

### Minor Changes

- 5dd7153: feat(NavMeshQuery): add findPolysAroundCircle and queryPolygons (@rob-myers)

  NavMeshQuery now supports:

  ```ts
  navMeshQuery.findPolysAroundCircle(startRef: number, centerPos: Vector3, radius: number, filter?: QueryFilter, maxResult?: number): {
      success: boolean;
      status: number;
      resultRefs: number[];
      resultParents: number[];
      resultCost: number;
      resultCount: number;
  }
  ```

  ```ts
  navMeshQuery.queryPolygons(center: Vector3, halfExtents: Vector3, filter?: QueryFilter, maxPolys?: number): {
      success: boolean;
      status: number;
      polyRefs: number[];
      polyCount: number;
  }
  ```

  See the new "Click Nearby Polygons" example: https://recast-navigation-js.isaacmason.com/?path=/story/navmeshquery-clicknearbypolygons--click-nearby-polygons

### Patch Changes

- 5dd7153: feat: bump webidl-dts-gen from 1.9.0 to 1.10.0
- dce5c98: feat: bump webidl-dts-gen from 1.8.0 to 1.9.0, fix TileCacheMeshProcess types

## 0.17.0

## 0.16.4

## 0.16.3

## 0.16.2

### Patch Changes

- 1abdcc8: chore(deps): bump webidl-dts-gen from 1.7.0 to 1.8.0

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
