---
'@recast-navigation/core': minor
'@recast-navigation/three': minor
---

BREAKING CHANGE: `generateSoloNavMesh` and `generateTiledNavMesh` no longer internally reverse input indices, this aligns the required input format with recast navigation c++ library itself (OpenGL conventions)

The `generateSoloNavMesh` and `generateTiledNavMesh` were inadvertently reversing input indices. The three.js helpers `threeToSoloNavMesh` and `threeToTiledNavMesh` were also reversing indices so front faces would be walkable. This is likely an accidental leftover from using the BabylonJS recast plugin as the starting point of this library. Babylon at its core uses a left handed system.

If you were previously using the `generateSoloNavMesh` and `generateTiledNavMesh` nav mesh generators, you will need to reverse your input indices to have a counter-clockwise winding order. If you were using the `recast-navigation/three` helpers, you do not need to change anything.

