# @recast-navigation/generators

## 0.32.0

### Patch Changes

- Updated dependencies [73f3d0a]
- Updated dependencies [0c927b6]
- Updated dependencies [94d59b0]
  - @recast-navigation/core@0.32.0
  - @recast-navigation/wasm@0.32.0

## 0.31.1

### Patch Changes

- Updated dependencies [1b1f40e]
  - @recast-navigation/core@0.31.1
  - @recast-navigation/wasm@0.31.1

## 0.31.0

### Patch Changes

- 1571a45: feat: check whether the library has been initialised in the high level generators, throw a friendly error
- Updated dependencies [0fc8dd9]
- Updated dependencies [225a983]
- Updated dependencies [29e6ebc]
- Updated dependencies [e2a7112]
  - @recast-navigation/core@0.31.0
  - @recast-navigation/wasm@0.31.0

## 0.30.0

### Patch Changes

- Updated dependencies [938dd84]
- Updated dependencies [f4fec90]
- Updated dependencies [f4fec90]
  - @recast-navigation/core@0.30.0
  - @recast-navigation/wasm@0.30.0

## 0.29.2

### Patch Changes

- Updated dependencies [0b7f635]
  - @recast-navigation/core@0.29.2
  - @recast-navigation/wasm@0.29.2

## 0.29.1

### Patch Changes

- Updated dependencies [b7140ef]
  - @recast-navigation/wasm@0.29.1
  - @recast-navigation/core@0.29.1

## 0.29.0

### Patch Changes

- Updated dependencies [db2aa1b]
- Updated dependencies [89b2d29]
  - @recast-navigation/core@0.29.0
  - @recast-navigation/wasm@0.29.0

## 0.28.0

### Minor Changes

- remove cjs build - https://github.com/isaac-mason/recast-navigation-js/issues/351

### Patch Changes

- Updated dependencies [a86d2c3]
- Updated dependencies [365e0aa]
- Updated dependencies [365e0aa]
- Updated dependencies [f986fad]
- Updated dependencies [365e0aa]
- Updated dependencies [365e0aa]
  - @recast-navigation/core@0.28.0
  - @recast-navigation/wasm@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [3e73069]
- Updated dependencies [b67a423]
  - @recast-navigation/wasm@0.27.0
  - @recast-navigation/core@0.27.0

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

- 6161d8b: fix: @recast-navigation/generators should not be included in @recast-navigation/three bundle
- Updated dependencies [6161d8b]
  - @recast-navigation/core@0.26.0
  - @recast-navigation/wasm@0.26.0

## 0.25.0

### Minor Changes

- db8f331: feat: expose and correctly cleanup polyMesh and polyMeshDetail

### Patch Changes

- Updated dependencies [2b38988]
- Updated dependencies [2b38988]
- Updated dependencies [db8f331]
  - @recast-navigation/core@0.25.0
  - @recast-navigation/wasm@0.25.0

## 0.24.1

### Patch Changes

- @recast-navigation/core@0.24.1
- @recast-navigation/wasm@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [a4636e1]
- Updated dependencies [4b1fcf8]
  - @recast-navigation/core@0.24.0
  - @recast-navigation/wasm@0.24.0

## 0.23.0

### Patch Changes

- 5cb17a1: feat: omit minRegionArea and maxEdgeLen from TileCacheGeneratorConfig type
- Updated dependencies [46e6fb2]
- Updated dependencies [a594296]
- Updated dependencies [9841a9c]
- Updated dependencies [72d99b1]
- Updated dependencies [9841a9c]
  - @recast-navigation/core@0.23.0
  - @recast-navigation/wasm@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [cb6290c]
- Updated dependencies [cb6290c]
  - @recast-navigation/core@0.22.0
  - @recast-navigation/wasm@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [d8a6280]
  - @recast-navigation/core@0.21.0
  - @recast-navigation/wasm@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [56f1855]
- Updated dependencies [56f1855]
  - @recast-navigation/core@0.20.0
  - @recast-navigation/wasm@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [d490a5c]
  - @recast-navigation/core@0.19.0
  - @recast-navigation/wasm@0.19.0

## 0.18.2

### Patch Changes

- Updated dependencies [489bdb5]
- Updated dependencies [489bdb5]
  - @recast-navigation/core@0.18.2
  - @recast-navigation/wasm@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies [236b810]
  - @recast-navigation/wasm@0.18.1
  - @recast-navigation/core@0.18.1

## 0.18.0

### Patch Changes

- e7f2c47: feat: use wrapped calcGridSize instead of Raw.Recast.calcGridSize
- Updated dependencies [5dd7153]
- Updated dependencies [5dd7153]
- Updated dependencies [dce5c98]
  - @recast-navigation/core@0.18.0
  - @recast-navigation/wasm@0.18.0

## 0.17.0

### Patch Changes

- @recast-navigation/core@0.17.0
- @recast-navigation/wasm@0.17.0

## 0.16.4

### Patch Changes

- @recast-navigation/core@0.16.4
- @recast-navigation/wasm@0.16.4

## 0.16.3

### Patch Changes

- @recast-navigation/core@0.16.3
- @recast-navigation/wasm@0.16.3

## 0.16.2

### Patch Changes

- Updated dependencies [1abdcc8]
  - @recast-navigation/wasm@0.16.2
  - @recast-navigation/core@0.16.2

## 0.16.1

### Patch Changes

- 467747f: feat: add usage oriented aliases to 'Arrays' such as 'TriAreasArray'
- Updated dependencies [467747f]
  - @recast-navigation/core@0.16.1
  - @recast-navigation/wasm@0.16.1

## 0.16.0

### Patch Changes

- Updated dependencies [b5f4f6e]
  - @recast-navigation/core@0.16.0
  - @recast-navigation/wasm@0.16.0

## 0.15.1

### Patch Changes

- Updated dependencies [5ab6094]
  - @recast-navigation/core@0.15.1
  - @recast-navigation/wasm@0.15.1

## 0.15.0

### Minor Changes

- 91c8d94: feat: remove RecastConfig class, add createRcConfig and cloneRcConfig utils
- 91c8d94: feat: rename RecastConfigType type to RecastConfig

### Patch Changes

- Updated dependencies [91c8d94]
- Updated dependencies [4927779]
- Updated dependencies [91c8d94]
  - @recast-navigation/core@0.15.0
  - @recast-navigation/wasm@0.15.0

## 0.14.0

### Minor Changes

- e0ec30e: feat: move NavMesh generators from '@recast-navigation/core' into new package '@recast-navigation/generators'

### Patch Changes

- Updated dependencies [7a6d531]
- Updated dependencies [3d47fb8]
- Updated dependencies [e0ec30e]
  - @recast-navigation/core@0.14.0
  - @recast-navigation/wasm@0.14.0
