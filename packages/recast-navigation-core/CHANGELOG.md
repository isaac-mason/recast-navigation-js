# @recast-navigation/core

## 0.31.1

### Patch Changes

- 1b1f40e: fix(DetourLink): use 'next' property instead of 'get_next' function
  - @recast-navigation/wasm@0.31.1

## 0.31.0

### Minor Changes

- 0fc8dd9: feat(CrowdAgent): add overOffMeshConnection
- 225a983: feat: add support for getting/setting random seed used by NavMeshQuery

### Patch Changes

- Updated dependencies [225a983]
- Updated dependencies [29e6ebc]
- Updated dependencies [e2a7112]
  - @recast-navigation/wasm@0.31.0

## 0.30.0

### Minor Changes

- 938dd84: feat: add CrowdAgent method "target" for getting the current agent target position
- f4fec90: fix: "nextTargetInPath" should return the next agent corner position, not the current target position
- f4fec90: feat: rename CrowdAgent "nextTargetPath" to "nextTargetInPath"

### Patch Changes

- @recast-navigation/wasm@0.30.0

## 0.29.2

### Patch Changes

- 0b7f635: feat: add halfExtents option to NavMeshQuery computePath
  - @recast-navigation/wasm@0.29.2

## 0.29.1

### Patch Changes

- Updated dependencies [b7140ef]
  - @recast-navigation/wasm@0.29.1

## 0.29.0

### Minor Changes

- db2aa1b: feat(Crowd): improve 'update' method, add support for fixed time stepping with interpolation

  The previous `update` method did a form of variable time stepping with a target time step.

  This has been replaced with a method that supports fixed time stepping, variable time stepping, and fixed time stepping with interpolation.

  The new method signature is:

  ```ts
  update(dt: number, timeSinceLastCalled?: number, maxSubSteps?: number): void;
  ```

  To perform a variable sized time step update, call `update` with the time since the last call.

  ```ts
  crowd.update(deltaTime);
  ```

  Similarly, to perform fixed time stepping, call `update` with the `dt` parameter.

  ```ts
  crowd.update(1 / 60);
  ```

  To perform fixed time stepping with interpolation, call `update` with the `dt`, `timeSinceLastCalled`, and `maxSubSteps` parameters.

  ```ts
  const dt = 1 / 60;
  const timeSinceLastCalled = /* get this from your game loop */;
  const maxSubSteps = 10; // optional, default is 10

  crowd.update(dt, timeSinceLastCalled, maxSubSteps);
  ```

  The interpolated position of the agents can be retrieved from `agent.interpolatedPosition`.

  If the old behavior is desired, the following can be done:

  ```ts
  const crowd = new Crowd(navMesh);

  const targetStepSize = 1 / 60;
  const maxSubSteps = 10;
  const episilon = 0.001;

  const update = (deltaTime: number) => {
    if (deltaTime <= Epsilon) {
      return;
    }

    if (targetStepSize <= episilon) {
      crowd.update(deltaTime);
    } else {
      let iterationCount = Math.floor(deltaTime / targetStepSize);

      if (iterationCount > maxSubSteps) {
        iterationCount = maxSubSteps;
      }
      if (iterationCount < 1) {
        iterationCount = 1;
      }

      const step = deltaTime / iterationCount;
      for (let i = 0; i < iterationCount; i++) {
        crowd.update(step);
      }
    }
  };
  ```

  As part of this change, the `maximumSubStepCount`, `timeStep`, and `timeFactor` Crowd properties have been removed.

- 89b2d29: feat(CrowdAgent): add desiredVelocity, desiredVelocityObstacleAdjusted

### Patch Changes

- @recast-navigation/wasm@0.29.0

## 0.28.0

### Minor Changes

- remove cjs build - https://github.com/isaac-mason/recast-navigation-js/issues/351

- a86d2c3: feat: change Crowd and NavMeshQuery constructors to take NavMesh as first arg, and options as second

  old usage:

  ```ts
  import { NavMesh, Crowd, NavMeshQuery } from "recast-navigation";

  const navMesh = new NavMesh();

  const crowd = new Crowd({
    navMesh,
    maxAgents: 100,
    maxAgentRadius: 0.6,
  });

  const navMeshQuery = new NavMeshQuery({ navMesh });
  ```

  new usage:

  ```ts
  import { NavMesh, Crowd, NavMeshQuery } from "recast-navigation";

  const navMesh = new NavMesh();

  const crowd = new Crowd(navMesh, {
    maxAgents: 100,
    maxAgentRadius: 0.6,
  });

  const navMeshQuery = new NavMeshQuery(navMesh);
  ```

- 365e0aa: fix: change findPolysAroundCircle resultCost to be a FloatArray, not a FloatRef
- 365e0aa: feat(NavMeshQuery): rename closestPointOnPoly posOverPoly return to isPointOverPoly
- f986fad: feat: support separate wasm file as well as inlined wasm file

  Progresses https://github.com/isaac-mason/recast-navigation-js/issues/164

  Now `init` can be optionally passed a default import of one of the `@recast-navigation/wasm` packages.

  The `@recast-navigation/wasm` package is no longer included in the `@recast-navigation/core` package. If nothing is passed to `init`, the inlined wasm-compat flavor is dynamically imported.

  Note that the other `wasm` flavor currently does not support node.js environments.

  ```ts
  import { init } from "recast-navigation";

  // import the 'wasm' flavor - has a separate wasm file, not inlined
  import RecastWasm from "@recast-navigation/wasm/wasm";

  await init(RecastWasm);
  ```

  It's still possible to use the inlined wasm flavor by not passing anything to `init` as before.

  ```ts
  import { init } from "recast-navigation";

  // internally dynamically imports `@recast-navigation/wasm`
  await init();
  ```

- 365e0aa: feat(Arrays): rename 'free' to 'destroy' for consistency with other methods
- 365e0aa: fix: missing cleanup for Raw Vec3 and \*Ref classes

### Patch Changes

- Updated dependencies [365e0aa]
  - @recast-navigation/wasm@0.28.0

## 0.27.0

### Minor Changes

- b67a423: feat: simplify return type of NavMesh getTileAndPolyByRef, getTileAndPolyByRefUnsafe

  usage change from:

  ```ts
  const result = navMesh.getTileAndPolyByRef(ref);
  const status = result.status();
  const tile = result.tile();
  const poly = result.poly();
  ```

  to:

  ```ts
  const { success, status, tile, poly } = navMesh.getTileAndPolyByRef(ref);
  ```

### Patch Changes

- Updated dependencies [3e73069]
  - @recast-navigation/wasm@0.27.0

## 0.26.0

### Minor Changes

- 6161d8b: feat: remove 'Arrays' export, add wrapped array classes

  usage changed from:

  ```ts
  import { Arrays } from "@recast-navigation/core";

  Arrays.VertsArray;
  Arrays.TrisArray;
  Arrays.TriAreasArray;
  Arrays.ChunkIdsArray;
  Arrays.TileCacheData;
  ```

  to:

  ```ts
  import {
    VerticesArray,
    TrianglesArray,
    TringleAreasArray,
    ChunkIdsArray,
    TileCacheData,
  } from "@recast-navigation/core";
  ```

  The `.copy` method now directly copies the data from the source array to the emscripten heap. This should improve performance when copying large arrays.

### Patch Changes

- @recast-navigation/wasm@0.26.0

## 0.25.0

### Minor Changes

- 2b38988: feat: expose CrowdAgent requestMoveVelocity
- 2b38988: feat: rename CrowdAgent goto to requestMoveTarget, aligned with c++ api
- db8f331: feat: expose duDebugDraw recast and detour debug drawing utilities

### Patch Changes

- Updated dependencies [db8f331]
  - @recast-navigation/wasm@0.25.0

## 0.24.1

### Patch Changes

- @recast-navigation/wasm@0.24.1

## 0.24.0

### Minor Changes

- a4636e1: feat: replace getRandomPointAround with improved findRandomPointAroundCircle

  Renamed `getRandomPointAround` to `findRandomPointAroundCircle` to align the naming with the c++ api and other methods.

  `findRandomPointAroundCircle` now returns a `success` and `status` property. Previously if the operation was unsuccessful, a zero vector was returned. Now, the `success` property will be `false` and the `status` property will contain a dtStatus describing the reason for failure.

- 4b1fcf8: feat(NavMeshQuery): replace getClosestPoint with improved findClosestPoint

  Renamed `getClosestPoint` to `findClosestPoint` to align naming with other methods.

  `findClosestPoint` now returns a `success` and `status` property Previously if the operation was unsuccessful, a zero vector was returned. Now, the `success` property will be `false` and the `status` property will contain a dtStatus describing the reason for failure.

### Patch Changes

- Updated dependencies [4b1fcf8]
  - @recast-navigation/wasm@0.24.0

## 0.23.0

### Minor Changes

- 46e6fb2: feat(NavMeshQuery): expose success and error information for computePath

  previous usage:

  ```ts
  const path = navMeshQuery.computePath(
    { x: 0, y: 0, z: 0 }, // start position
    { x: 2, y: 0, z: 0 }, // end position
  );
  ```

  updated usage:

  ```ts
  const { success, error, path } = navMeshQuery.computePath(
    { x: 0, y: 0, z: 0 }, // start position
    { x: 2, y: 0, z: 0 }, // end position
  );
  ```

- a594296: feat(NavMeshQuery): expose findStraightPath
- 9841a9c: feat(NavMeshQuery): change queryPolygons to take an 'options' object for optional parameters
- 72d99b1: feat(NavMeshQuery): expose raycast
- 9841a9c: feat(NavMeshQuery): change findPolysAroundCircle to take an 'options' object for optional parameters

### Patch Changes

- @recast-navigation/wasm@0.23.0

## 0.22.0

### Minor Changes

- cb6290c: feat(NavMeshQuery): rename computePath maxPolyPathLength option to maxPathPolys
- cb6290c: feat(NavMeshQuery): add maxStraightPathPoints option to computePath

### Patch Changes

- @recast-navigation/wasm@0.22.0

## 0.21.0

### Minor Changes

- d8a6280: feat: expose dtNavMesh `decodePolyId` and `encodePolyId`

### Patch Changes

- Updated dependencies [d8a6280]
  - @recast-navigation/wasm@0.21.0

## 0.20.0

### Minor Changes

- 56f1855: feat: add detour status helpers statusSucceed, statusFailed, statusInProgress, statusDetail
- 56f1855: feat: rename dtStatusToReadableString to statusToReadableString

### Patch Changes

- @recast-navigation/wasm@0.20.0

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
    angle,
  );
  ```

  Additionally `removeObstacle` now returns a result object with `success` and `status` properties.

  ```ts
  const { success, status } = tileCache.removeObstacle(obstacle);
  ```

### Patch Changes

- Updated dependencies [d490a5c]
  - @recast-navigation/wasm@0.19.0

## 0.18.2

### Patch Changes

- 489bdb5: feat(TileCache): improve tileCache.update jsdoc
- 489bdb5: feat(TileCache): add 'success' to tileCache.update result
  - @recast-navigation/wasm@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies [236b810]
  - @recast-navigation/wasm@0.18.1

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

- Updated dependencies [5dd7153]
- Updated dependencies [5dd7153]
- Updated dependencies [dce5c98]
  - @recast-navigation/wasm@0.18.0

## 0.17.0

### Patch Changes

- @recast-navigation/wasm@0.17.0

## 0.16.4

### Patch Changes

- @recast-navigation/wasm@0.16.4

## 0.16.3

### Patch Changes

- @recast-navigation/wasm@0.16.3

## 0.16.2

### Patch Changes

- Updated dependencies [1abdcc8]
  - @recast-navigation/wasm@0.16.2

## 0.16.1

### Patch Changes

- 467747f: feat: add usage oriented aliases to 'Arrays' such as 'TriAreasArray'
  - @recast-navigation/wasm@0.16.1

## 0.16.0

### Minor Changes

- b5f4f6e: feat: update NavMeshQuery to use wrapped QueryFilter class, remove 'index' from QueryFilter

### Patch Changes

- @recast-navigation/wasm@0.16.0

## 0.15.1

### Patch Changes

- 5ab6094: fix: correct outdated RecastConfig type jsdoc
  - @recast-navigation/wasm@0.15.1

## 0.15.0

### Minor Changes

- 91c8d94: feat: remove RecastConfig class, add createRcConfig and cloneRcConfig utils
- 91c8d94: feat: rename RecastConfigType type to RecastConfig

### Patch Changes

- 4927779: fix: CrowdAgent setParameters should take a partial of CrowdAgentParams
  - @recast-navigation/wasm@0.15.0

## 0.14.0

### Minor Changes

- 3d47fb8: feat: remove off mesh connections params from generateTileCache, add docs for alternative via custom TileCacheMeshProcess
- e0ec30e: feat: move NavMesh generators from '@recast-navigation/core' into new package '@recast-navigation/generators'

### Patch Changes

- 7a6d531: feat(Crowd): add getFilter, QueryFilter wrapper class for raw dtQueryFilter
  - @recast-navigation/wasm@0.14.0

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
