# recast-navigation

## 0.15.0

### Minor Changes

- 91c8d94: feat: remove RecastConfig class, add createRcConfig and cloneRcConfig utils
- 91c8d94: feat: rename RecastConfigType type to RecastConfig

### Patch Changes

- 4927779: fix: CrowdAgent setParameters should take a partial of CrowdAgentParams
- Updated dependencies [91c8d94]
- Updated dependencies [4927779]
- Updated dependencies [91c8d94]
  - @recast-navigation/generators@0.15.0
  - @recast-navigation/core@0.15.0
  - @recast-navigation/three@0.15.0

## 0.14.0

### Minor Changes

- 3d47fb8: feat: remove off mesh connections params from generateTileCache, add docs for alternative via custom TileCacheMeshProcess
- e0ec30e: feat: move NavMesh generators from '@recast-navigation/core' into new package '@recast-navigation/generators'

### Patch Changes

- 7a6d531: feat(Crowd): add getFilter, QueryFilter wrapper class for raw dtQueryFilter
- Updated dependencies [7a6d531]
- Updated dependencies [3d47fb8]
- Updated dependencies [e0ec30e]
  - @recast-navigation/core@0.14.0
  - @recast-navigation/generators@0.14.0
  - @recast-navigation/three@0.14.0

## 0.13.3

### Patch Changes

- 9ef585d: feat(Agent): add getters and setters for params
- Updated dependencies [9ef585d]
  - @recast-navigation/core@0.13.3
  - @recast-navigation/three@0.13.3

## 0.13.2

### Patch Changes

- 63be9aa: fix: make importNavMesh tileCacheMeshProcess argument optional
- f32f79e: feat: add missing 'halfExtents' options to NavMeshQuery methods
- Updated dependencies [63be9aa]
- Updated dependencies [f32f79e]
  - @recast-navigation/core@0.13.2
  - @recast-navigation/three@0.13.2

## 0.13.1

### Patch Changes

- 44a77fe: chore: bump webidl-dts-gen from 1.6.0 to 1.7.0
  - @recast-navigation/core@0.13.1
  - @recast-navigation/three@0.13.1

## 0.13.0

### Minor Changes

- 106044a: refactor: consistent naming for JSImplementation structs

### Patch Changes

- @recast-navigation/core@0.13.0
- @recast-navigation/three@0.13.0

## 0.12.1

### Patch Changes

- 63fb772: fix: generateTiledNavMesh buildContext logs weren't logging nverts and npolys correctly
- Updated dependencies [63fb772]
  - @recast-navigation/core@0.12.1
  - @recast-navigation/three@0.12.1

## 0.12.0

### Minor Changes

- 6723287: feat: lower maximum memory usage for `generateTiledNavMesh` and `generateTileCache` when `keepIntermediates` is false

  Previously tile intermediates were only released after processing all tiles or on failure. This has been changed so intermediates are released after processing each tile.

- 22c5fe2: feat: remove unnecessary `destroy()` methods
- defdfb2: feat(NavMeshCreateParams): add defaults for off mesh connection params `area` and `flag`
- 257e988: feat: remove FinalizationRegistry functionality

  This was added to catch situations where `destroy()` is not called to free memory. It's current implementation isn't ideal and it adds a fair amount of complexity to the library, so it's being removed for now.

### Patch Changes

- Updated dependencies [6723287]
- Updated dependencies [22c5fe2]
- Updated dependencies [defdfb2]
- Updated dependencies [257e988]
  - @recast-navigation/core@0.12.0
  - @recast-navigation/three@0.12.0

## 0.11.0

### Patch Changes

- 8d8beeb: feat: improve NavMeshQuery jsdoc
- Updated dependencies [8d8beeb]
  - @recast-navigation/core@0.11.0
  - @recast-navigation/three@0.11.0

## 0.10.2

### Patch Changes

- 0dcaa32: fix: tiled nav mesh generator bounding box expansion
- Updated dependencies [0dcaa32]
  - @recast-navigation/core@0.10.2
  - @recast-navigation/three@0.10.2

## 0.10.1

### Patch Changes

- 4c55822: feat: update README.md with docs for off mesh connections
- Updated dependencies [4c55822]
  - @recast-navigation/three@0.10.1
  - @recast-navigation/core@0.10.1

## 0.10.0

### Minor Changes

- 0b38fa9: feat: add OffMeshConnectionsHelper
- 0b38fa9: feat: expose off mesh connections functionality

### Patch Changes

- Updated dependencies [0b38fa9]
- Updated dependencies [0b38fa9]
  - @recast-navigation/three@0.10.0
  - @recast-navigation/core@0.10.0

## 0.9.3

### Patch Changes

- @recast-navigation/core@0.9.3
- @recast-navigation/three@0.9.3

## 0.9.2

### Patch Changes

- 00b3af2: fix(package.json): 'files' missing mjs files
  - @recast-navigation/core@0.9.2
  - @recast-navigation/three@0.9.2

## 0.9.1

### Patch Changes

- 1291ce0: fix(package.json): 'module' path
  - @recast-navigation/core@0.9.1
  - @recast-navigation/three@0.9.1

## 0.9.0

### Minor Changes

- 82a1bb1: feat: add cjs builds

### Patch Changes

- Updated dependencies [82a1bb1]
  - @recast-navigation/three@0.9.0
  - @recast-navigation/core@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [9c3a8c7]
- Updated dependencies [751e029]
- Updated dependencies [9c3a8c7]
  - @recast-navigation/core@0.8.0
  - @recast-navigation/three@0.8.0

## 0.7.3

### Patch Changes

- 6ffbab9: fix: image in README.md
  - @recast-navigation/core@0.7.3
  - @recast-navigation/three@0.7.3

## 0.7.2

### Patch Changes

- 7e0ec16: chore: update README.md
  - @recast-navigation/core@0.7.2
  - @recast-navigation/three@0.7.2

## 0.7.1

### Patch Changes

- 089a942: fix: three and @types/three peer deps
- Updated dependencies [089a942]
  - @recast-navigation/three@0.7.1
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
  - @recast-navigation/three@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [5e79ceb]
- Updated dependencies [5e79ceb]
- Updated dependencies [5e79ceb]
  - @recast-navigation/core@0.6.0
  - @recast-navigation/three@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [5728e0c]
- Updated dependencies [820b928]
- Updated dependencies [86554c1]
- Updated dependencies [820b928]
- Updated dependencies [86554c1]
- Updated dependencies [86554c1]
  - @recast-navigation/core@0.5.0
  - @recast-navigation/three@0.5.0

## 0.4.1

### Patch Changes

- Updated dependencies [0a1bf73]
  - @recast-navigation/core@0.4.1
  - @recast-navigation/three@0.4.1

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

### Patch Changes

- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
- Updated dependencies [de28866]
  - @recast-navigation/core@0.4.0
  - @recast-navigation/three@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [45d09df]
  - @recast-navigation/three@0.3.0
  - @recast-navigation/core@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [cd82927]
- Updated dependencies [cd82927]
  - @recast-navigation/three@0.2.0
  - @recast-navigation/core@0.2.0

## 0.1.2

### Patch Changes

- Updated dependencies [273c456]
  - @recast-navigation/core@0.1.2
  - @recast-navigation/three@0.1.2

## 0.1.1

### Patch Changes

- b67eb8b: feat: make EXPECTED_LAYERS_PER_TILE and MAX_LAYERS constants configurable
- Updated dependencies [b67eb8b]
  - @recast-navigation/core@0.1.1
  - @recast-navigation/three@0.1.1

## 0.1.0

### Minor Changes

- 44c71f0: feat: expose dtNavMesh methods and related classes

### Patch Changes

- Updated dependencies [44c71f0]
- Updated dependencies [44c71f0]
- Updated dependencies [44c71f0]
  - @recast-navigation/three@0.1.0
  - @recast-navigation/core@0.1.0

## 0.0.7

### Patch Changes

- Updated dependencies [c1e1d38]
- Updated dependencies [87e768b]
- Updated dependencies [dfe1bcb]
- Updated dependencies [dfe1bcb]
- Updated dependencies [c1e1d38]
- Updated dependencies [dfe1bcb]
  - @recast-navigation/three@0.0.7
  - @recast-navigation/core@0.0.7

## 0.0.6

### Patch Changes

- Updated dependencies [ad1adaa]
  - @recast-navigation/core@0.0.6
  - @recast-navigation/three@0.0.6

## 0.0.5

### Patch Changes

- @recast-navigation/core@0.0.5
- @recast-navigation/three@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies [0e68563]
- Updated dependencies [49d0523]
- Updated dependencies [14003a7]
  - @recast-navigation/three@0.0.4
  - @recast-navigation/core@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies [05825a8]
  - @recast-navigation/core@0.0.3
  - @recast-navigation/three@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [74dfbb4]
  - @recast-navigation/three@0.0.2
  - @recast-navigation/core@0.0.2

## 0.0.1

- Initial alpha release!
