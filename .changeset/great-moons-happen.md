---
'@recast-navigation/core': minor
'recast-navigation': minor
---

feat: lower maximum memory usage for `generateTiledNavMesh` and `generateTileCache` when `keepIntermediates` is false

Previously tile intermediates were only released after processing all tiles or on failure. This has been changed so intermediates are released after processing each tile.
