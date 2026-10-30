# Changelog

All `recast-navigation` packages are versioned together. Changes that only affect some packages are labelled with them.

## 0.44.0

- **core:** feat: add `destroy()` to `RecastBuildContext`, `RecastChunkyTriMesh` and `NavMeshCreateParams`
- **core, generators:** fix: free leaked wasm allocations in `generateTiledNavMesh`, `generateSoloNavMesh`, `generateTileCache` and `generateTileNavMeshData` (#514)
- **core, wasm:** fix: free off mesh connection arrays set with `NavMeshCreateParams.setOffMeshConnections`, and allocations made when the tile cache rebuilds tiles
- fix: add `repository` to package.json files
- chore: publish with npm trusted publishing and provenance. Pushes to `main` that don't change the version publish a canary (`0.0.0-canary-<date>-<sha>`) under the `canary` tag
- docs: new website at https://recast-navigation-js.isaacmason.com with the examples at `/examples/` and API docs at `/docs/`

## 0.43.1

- **core:** fix: changes to array classes for typescript 5.9 compat (@nyan-left, @isaac-mason)

## 0.43.0

- **core, wasm:** feat: bump webidl-dts-gen from v1.11.2 to v1.12.0
- **core, wasm:** feat: refactor recast build context bindings for naming clarity, remove unnecessary base RecastBuildContextImpl bindings

## 0.42.1

- **core:** fix: remove import from 'three' in @recast-navigation/core (@RolandCsibrei)

## 0.42.0

- **playcanvas:** fix: rename playcanvas util 'threeToTileCache' to 'pcToTileCache'

## 0.41.0

- **core:** feat: change drawNavMeshPolysWithFlags to take colors in duRGBA format
- **core:** feat: add utility 'rgbToDuRgba'

## 0.40.0

- **core, wasm:** fix: recast detour constants binding types
- **wasm:** feat: bump emsdk from 3.1.61 to 4.0.10
- **core:** fix: debug drawer util conversion from rgb hex color to recast/detour duRGBA color unsigned int

## 0.39.0

- **core:** feat: add floodFillPruneNavMesh utility
- **core:** feat: remove navMesh.getDebugNavMesh, add getNavMeshPositionsAndIndices utility
- **three, playcanvas:** feat: remove OffMeshConnectionsHelper in favour of DebugDrawer off mesh connection debug drawing

## 0.38.0

- **generators:** feat: add utils for generating solo and tiled navmesh tiles

  Added `generateSoloNavMeshData` and `generateTileNavMeshData` to the `@recast-navigation/generators` package.

  The logic for generating navmesh data was previously within the `generateSoloNavMesh` and `generateTiledNavMesh` utils.

  These utils make it easier to use the default navmesh generators for more use cases. For example, generating navmesh data for a single tile in a web worker, and sending the data back to the main thread where the `NavMesh` is created.
- **generators:** feat: add optional 'bounds' config to navmesh generators

  If provided, it will be used as the bounds for the navmesh heightfield during generation. If not provided, the bounds will be calculated from the input geometry. If the bounds are known ahead of time, providing them can save some time during generation.

## 0.37.0

- **generators:** fix: pass world units to dtNavMeshCreateParams instead of voxel units (@yelouafi)

  fixes https://github.com/isaac-mason/recast-navigation-js/issues/453

## 0.36.1

- **wasm:** fix: memory cleanup for some result classes and structs

## 0.36.0

- **core:** feat(NavMeshQuery): don't return 'polyCount' from queryPolygons, only incldue 'polyRefs' from 0 to 'polyCount'

## 0.35.2

- **three:** fix: import three/addons directly to avoid issues with vite dev mode

## 0.35.1

- **core, generators, three, playcanvas:** feat: remove terser, ship human readable javascript to npm

## 0.35.0

- **recast-navigation:** feat: remove 'three' entrypoint from 'recast-navigation' package

  To make way for adding other integration packages without bloating the `recast-navigation` package, the `recast-navigation/three` entrypoint has been removed.

  If you are importing from `recast-navigation/three`, simply install and import from `@recast/navigation-three` instead.
- **generators:** feat: add mergePositionsAndIndices
- **three:** feat: change three debug helpers to take required params as standalone constructor arguments
- **three:** feat: avoid cloning meshes and geometry in getPositionsAndIndices

## 0.34.0

- **generators:** fix: set tiled navmesh intermediates to undefined after freeing wasm memory
- **three:** feat: remove resize from DebugDrawer, three LineMaterial no longer requires manually setting resolution

  If using an older version of three.js, you may need to manually set the resolution of the LineMaterial on `debugDrawer.lineMaterial`.
- **three:** fix: dispose DebugDrawer materials and geometry
- **three:** feat: refactor DebugDrawer handling of vertex data
- **three:** feat: increase linewidth for DebugDrawer default line material

## 0.33.0

- **core:** feat: split tilecache import/export into seperate importTileCache and exportTileCache functions

## 0.32.0

- **core:** feat(TileCache): rename BoxObstacle extent to halfExtents
- **core:** feat: expose recast and detour constants and enums in 'Recast' and 'Detour' objects
- **core:** feat: remove 'range' array utility

  The range utility was only used in examples, not in the core library.

  If you were using it, you can easily replace it with a simple code snippet.

  ```ts
  function range(n: number) {
    return [...Array(n)].map((_, i) => i);
  }
  ```

## 0.31.1

- **core:** fix(DetourLink): use 'next' property instead of 'get_next' function

## 0.31.0

- **core, wasm:** feat: add support for getting/setting random seed used by NavMeshQuery
- **wasm:** feat: use c++ 17
- **wasm:** feat: bump emsdk from 3.1.58 to 3.1.61
- **core:** feat(CrowdAgent): add overOffMeshConnection
- **generators:** feat: check whether the library has been initialised in the high level generators, throw a friendly error

## 0.30.0

- **core:** feat: add CrowdAgent method "target" for getting the current agent target position
- **core:** fix: "nextTargetInPath" should return the next agent corner position, not the current target position
- **core:** feat: rename CrowdAgent "nextTargetPath" to "nextTargetInPath"

## 0.29.2

- **core:** feat: add halfExtents option to NavMeshQuery computePath

## 0.29.1

- **wasm:** feat: remove unused Log util

## 0.29.0

- **core:** feat(Crowd): improve 'update' method, add support for fixed time stepping with interpolation

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
- **core:** feat(CrowdAgent): add desiredVelocity, desiredVelocityObstacleAdjusted

## 0.28.0

- **core, wasm:** fix: change findPolysAroundCircle resultCost to be a FloatArray, not a FloatRef
- **core, generators, three:** remove cjs build - https://github.com/isaac-mason/recast-navigation-js/issues/351
- **core:** feat: change Crowd and NavMeshQuery constructors to take NavMesh as first arg, and options as second

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
- **core:** feat(NavMeshQuery): rename closestPointOnPoly posOverPoly return to isPointOverPoly
- **core:** feat: support separate wasm file as well as inlined wasm file

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
- **core:** feat(Arrays): rename 'free' to 'destroy' for consistency with other methods
- **core:** fix: missing cleanup for Raw Vec3 and \*Ref classes

## 0.27.0

- **core:** feat: simplify return type of NavMesh getTileAndPolyByRef, getTileAndPolyByRefUnsafe

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
- **wasm:** feat: bump emsdk from 3.1.44 to 3.1.58

## 0.26.0

- **three:** feat(three): rename DebugDrawer methods from 'debugDraw*' to 'draw*'
- **core, generators:** feat: remove 'Arrays' export, add wrapped array classes

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
- **generators, three:** fix: @recast-navigation/generators should not be included in @recast-navigation/three bundle

## 0.25.0

- **core, three, wasm:** feat: expose duDebugDraw recast and detour debug drawing utilities
- **generators:** feat: expose and correctly cleanup polyMesh and polyMeshDetail
- **core:** feat: expose CrowdAgent requestMoveVelocity
- **core:** feat: rename CrowdAgent goto to requestMoveTarget, aligned with c++ api

## 0.24.1

- **recast-navigation:** fix: include sourcemaps in package.json "files"

## 0.24.0

- **core, wasm:** feat(NavMeshQuery): replace getClosestPoint with improved findClosestPoint

  Renamed `getClosestPoint` to `findClosestPoint` to align naming with other methods.

  `findClosestPoint` now returns a `success` and `status` property Previously if the operation was unsuccessful, a zero vector was returned. Now, the `success` property will be `false` and the `status` property will contain a dtStatus describing the reason for failure.
- **core:** feat: replace getRandomPointAround with improved findRandomPointAroundCircle

  Renamed `getRandomPointAround` to `findRandomPointAroundCircle` to align the naming with the c++ api and other methods.

  `findRandomPointAroundCircle` now returns a `success` and `status` property. Previously if the operation was unsuccessful, a zero vector was returned. Now, the `success` property will be `false` and the `status` property will contain a dtStatus describing the reason for failure.

## 0.23.0

- **core:** feat(NavMeshQuery): expose success and error information for computePath

  previous usage:

  ```ts
  const path = navMeshQuery.computePath(
    { x: 0, y: 0, z: 0 }, // start position
    { x: 2, y: 0, z: 0 } // end position
  );
  ```

  updated usage:

  ```ts
  const { success, error, path } = navMeshQuery.computePath(
    { x: 0, y: 0, z: 0 }, // start position
    { x: 2, y: 0, z: 0 } // end position
  );
  ```
- **core:** feat(NavMeshQuery): expose findStraightPath
- **core:** feat(NavMeshQuery): change queryPolygons to take an 'options' object for optional parameters
- **core:** feat(NavMeshQuery): expose raycast
- **core:** feat(NavMeshQuery): change findPolysAroundCircle to take an 'options' object for optional parameters
- **generators:** feat: omit minRegionArea and maxEdgeLen from TileCacheGeneratorConfig type

## 0.22.0

- **core:** feat(NavMeshQuery): rename computePath maxPolyPathLength option to maxPathPolys
- **core:** feat(NavMeshQuery): add maxStraightPathPoints option to computePath

## 0.21.0

- **core, wasm:** feat: expose dtNavMesh `decodePolyId` and `encodePolyId`

## 0.20.0

- **core:** feat: add detour status helpers statusSucceed, statusFailed, statusInProgress, statusDetail
- **core:** feat: rename dtStatusToReadableString to statusToReadableString

## 0.19.0

- **core, wasm:** feat(TileCache): expose detour result when adding and removing obstacles

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

- **core:** feat(TileCache): improve tileCache.update jsdoc
- **core:** feat(TileCache): add 'success' to tileCache.update result

## 0.18.1

- **wasm:** feat: bump webidl-dts-gen from 1.10.0 to 1.11.0

## 0.18.0

- **core, wasm:** feat(NavMeshQuery): add findPolysAroundCircle and queryPolygons (@rob-myers)

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
- **wasm:** feat: bump webidl-dts-gen from 1.8.0 to 1.9.0, fix TileCacheMeshProcess types
- **generators:** feat: use wrapped calcGridSize instead of Raw.Recast.calcGridSize
- **wasm:** feat: bump webidl-dts-gen from 1.9.0 to 1.10.0

## 0.17.0

- **three:** feat: update to latest recastnavigation version

## 0.16.4

- **three:** feat(three): use depthWrite false for default NavMeshHelper material

## 0.16.3

- **three:** fix: getPositionsAndIndices not correctly merging index 0 of mesh geometries

## 0.16.2

- **wasm:** chore(deps): bump webidl-dts-gen from 1.7.0 to 1.8.0

## 0.16.1

- **core, generators:** feat: add usage oriented aliases to 'Arrays' such as 'TriAreasArray'

## 0.16.0

- **core:** feat: update NavMeshQuery to use wrapped QueryFilter class, remove 'index' from QueryFilter

## 0.15.1

- **core:** fix: correct outdated RecastConfig type jsdoc

## 0.15.0

- **core, generators:** feat: remove RecastConfig class, add createRcConfig and cloneRcConfig utils
- **core, generators:** feat: rename RecastConfigType type to RecastConfig
- **core:** fix: CrowdAgent setParameters should take a partial of CrowdAgentParams

## 0.14.0

- **core:** feat: remove off mesh connections params from generateTileCache, add docs for alternative via custom TileCacheMeshProcess
- **core, generators:** feat: move NavMesh generators from '@recast-navigation/core' into new package '@recast-navigation/generators'
- **core:** feat(Crowd): add getFilter, QueryFilter wrapper class for raw dtQueryFilter

## 0.13.3

- **core:** feat(Agent): add getters and setters for params

## 0.13.2

- **core:** fix: make importNavMesh tileCacheMeshProcess argument optional
- **core:** feat: add missing 'halfExtents' options to NavMeshQuery methods

## 0.13.1

- **wasm:** chore: bump webidl-dts-gen from 1.6.0 to 1.7.0

## 0.13.0

- **wasm:** refactor: consistent naming for JSImplementation structs

## 0.12.1

- **core:** fix: generateTiledNavMesh buildContext logs weren't logging nverts and npolys correctly

## 0.12.0

- **core:** feat: lower maximum memory usage for `generateTiledNavMesh` and `generateTileCache` when `keepIntermediates` is false

  Previously tile intermediates were only released after processing all tiles or on failure. This has been changed so intermediates are released after processing each tile.
- **core:** feat: remove unnecessary `destroy()` methods
- **core:** feat(NavMeshCreateParams): add defaults for off mesh connection params `area` and `flag`
- **core:** feat: remove FinalizationRegistry functionality

  This was added to catch situations where `destroy()` is not called to free memory. It's current implementation isn't ideal and it adds a fair amount of complexity to the library, so it's being removed for now.

## 0.11.0

- **wasm:** refactor: seperate recast-navigation.h and recast-navigation.cpp into multiple files
- **core:** feat: improve NavMeshQuery jsdoc

## 0.10.2

- **core:** fix: tiled nav mesh generator bounding box expansion

## 0.10.1

- **three:** feat: update README.md with docs for off mesh connections

## 0.10.0

- **core, wasm:** feat: expose off mesh connections functionality
- **three:** feat: add OffMeshConnectionsHelper

## 0.9.3

- **wasm:** fix: parcel and react-scripts support

## 0.9.2

- **recast-navigation:** fix(package.json): 'files' missing mjs files

## 0.9.1

- **recast-navigation:** fix(package.json): 'module' path

## 0.9.0

- **core, three:** feat: add cjs builds

## 0.8.0

- **core:** feat(NavMeshQuery): add getPolyHeight
- **core:** feat: add 'success' to NavMeshQuery method return objects
- **three:** feat: change CrowdHelper agent geometry from capsule to cylinder

## 0.7.3

- **recast-navigation:** fix: image in README.md
- **wasm:** feat(NavMeshQuery): alloc dtNavMeshQuery once, not every init

## 0.7.2

- **recast-navigation:** chore: update README.md

## 0.7.1

- **three:** fix: three and @types/three peer deps

## 0.7.0

- **core, wasm:** feat: remove `TileCacheData` and `NavMeshData`, use `UnsignedCharArray` instead
- **core, wasm:** feat: add rcContext implementation for timers and logging
- **wasm:** feat: rename ChunkyTriMesh to ChunkyTriMeshUtils
- **wasm:** feat: replace `DetourNavMeshBuilder::setSoloNavMeshCreateParams` with `DetourNavMeshBuilder::setPolyMeshCreateParams` and `DetourNavMeshBuilder::setPolyMeshDetailCreateParams`
- **core:** feat: rename `generateTiledNavMesh` to `generateTileCache`, add `generateTiledNavMesh` that doesn't use `TileCache` and supports large tile sizes
- **core:** feat: add CrowdAgent class, move agent methods from Crowd to CrowdAgent
- **core:** feat: add `NavMeshParams` class, wrapper over raw `dtNavMeshParams`
- **core:** feat: rename dtPoly wrapper class to DetourPoly
- **core:** feat: add more higher-level wrapper classes and functions for nav mesh generation

## 0.6.0

- **wasm:** feat: remove unused NavPath
- **wasm:** feat: remove DebugNavMesh, NavMesh::getDebugNavMesh, Triangle
- **core:** feat(NavMesh): remove DebugNavMesh, change navMesh.getDebugNavMesh to return positions and indices arrays
- **core:** fix: debug nav mesh would not cover the whole nav mesh in some cases
- **three:** feat(HeightfieldHelper): call update on construction

## 0.5.0

- **core, wasm:** feat(NavMesh): simplify `getPolyArea`, `getOffMeshConnectionsPolyEndPoints`, `addTile` return types
- **core, wasm:** feat(NavMeshQuery): change methods to have a `options` argument for optional filters, half extents, max sizes
- **core, three:** BREAKING CHANGE: `generateSoloNavMesh` and `generateTiledNavMesh` no longer internally reverse input indices, this aligns the required input format with recast navigation c++ library itself (OpenGL conventions)

  The `generateSoloNavMesh` and `generateTiledNavMesh` were inadvertently reversing input indices. The three.js helpers `threeToSoloNavMesh` and `threeToTiledNavMesh` were also reversing indices so front faces would be walkable. This is likely an accidental leftover from using the BabylonJS recast plugin as the starting point of this library. Babylon at its core uses a left handed system.

  If you were previously using the `generateSoloNavMesh` and `generateTiledNavMesh` nav mesh generators, you will need to reverse your input indices to have a counter-clockwise winding order. If you were using the `recast-navigation/three` helpers, you do not need to change anything.
- **core:** feat: add 'type' to nav mesh generator intermediates object, either 'solo' or 'tiled'
- **core:** feat: move computePath logic out of cpp, into js using exposed dtNavMeshQuery functionality
- **three:** fix: getPositionsAndIndices not merging index geometries correctly

## 0.4.1

- **core, wasm:** fix: raw types not resolving, not being included in docs

  Despite the fact that @recast-navigation/wasm is bundled into the core package, it still needs to be listed as a regular dependency so the types are available to the core package.

## 0.4.0

- **core, wasm:** feat: change `NavMeshGenerator` to two exports, `generateSoloNavMesh` and `generateTiledNavMesh`
- **core, wasm:** feat: expose functionality for setting poly areas, poly flags, off mesh connections
- **core, wasm:** feat: expose more of dtNavMeshQuery via NavMeshQuery
- feat: overhaul `Raw` recast and detour bindings
- **core:** feat: remove `NavMeshExporter` and `NavMeshImporter` classes, export functions `exportNavMesh` and `importNavMesh`
- **core, wasm:** feat: implement builtin solo and tiled nav mesh generators in js with `Raw` api
- **core, wasm:** feat: expose dtCrowd directly, move majority of crowd logic from c++ to js
- **core:** feat: remove `emscripten` object, move functionality into `Raw` api
- **three:** feat: helpers now extend THREE.Object3D and can be directly added to a THREE.Scene
- **three:** feat: rename all helper update methods to `update`, rather than having varying method names
- **wasm:** feat: update webidl-dts-gen

## 0.3.0

- **three:** refactor(HeightfieldHelper): rename `heightfield` to `heightfields`

## 0.2.0

- **core, wasm:** feat(NavMeshGenerator): split `generate` into `generateSoloNavMesh` and `generateTiledNavMesh`
- **three:** feat: split threeToNavMesh into threeToSoloNavMesh and threeToTiledNavMesh

## 0.1.2

- **core, wasm:** feat: add destroy() methods to classes that need cleanup, address vec3 leaks
- **wasm:** fix: was not passing 'cfg.borderSize' to 'rcBuildRegions'

## 0.1.1

- **core, wasm:** feat: make EXPECTED_LAYERS_PER_TILE and MAX_LAYERS constants configurable

## 0.1.0

- **core, wasm:** feat: expose dtNavMesh methods and related classes
- **core, three, wasm:** feat: fix DebugNavMesh winding
- **core, wasm:** feat: add DtStatus constants and utils

## 0.0.7

- **core, three, wasm:** feat: split NavMesh into multiple classes, update helpers

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
- **core, wasm:** fix: walkable slope angle not affecting generated navmesh
- **core, wasm:** feat: add 'success' field to NavMeshGeneratorResult
- **three:** fix: widen peer dependency version range for `three`
- **three:** feat(three): change getPositionsAndIndices to return typed arrays
- **three:** fix: @recast-navigation/three dependency on three should be a dev dependency

## 0.0.6

- **core:** feat: improve jsdoc

## 0.0.5

- **wasm:** feat: enable resizable heap for complex navmesh generation

## 0.0.4

- **core, three:** feat: remove events, expose update methods on three helpers
- **three:** feat(threeToNavMesh): add support for non-indexed geometries
- **three:** feat: rename params and properties for helper custom materials
- **wasm:** refactor: move solo navmesh generation into computeSoloNavMesh function
- **wasm:** chore: bump webidl-dts-gen from 0.0.3 to 1.1.1

## 0.0.3

- **core:** fix: make `@recast-navigation/wasm` a dev dependency of `@recast-navigation/core`.

  `@recast-navigation/wasm` is inlined in `@recast-navigation/core`'s build output, so it doesn't need to be a dependency of `@recast-navigation/core`.

## 0.0.2

- **three:** feat: change `threeToNavMesh` and `threeToNavMeshArgs` to take an array of meshes instead of an object to traverse

## 0.0.1

- Initial alpha release!

