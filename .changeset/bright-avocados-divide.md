---
'@recast-navigation/generators': minor
'recast-navigation': minor
---

feat: add utils for generating solo and tiled navmesh tiles

Added `generateSoloNavMeshData` and `generateTileNavMeshData` to the `@recast-navigation/generators` package.

The logic for generating navmesh data was previously within the `generateSoloNavMesh` and `generateTiledNavMesh` utils.

These utils make it easier to use the default navmesh generators for more use cases. For example, generating navmesh data for a single tile in a web worker, and sending the data back to the main thread where the `NavMesh` is created.
