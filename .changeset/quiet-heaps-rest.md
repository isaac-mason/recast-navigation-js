---
"@recast-navigation/wasm": patch
"@recast-navigation/core": patch
"@recast-navigation/generators": patch
"recast-navigation": patch
---

fix: free leaked wasm allocations in generateTiledNavMesh, generateSoloNavMesh and generateTileCache, and in off mesh connections and TileCache mesh processing (#514)
