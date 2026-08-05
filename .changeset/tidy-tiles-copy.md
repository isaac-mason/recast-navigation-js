---
'@recast-navigation/core': minor
'@recast-navigation/wasm': patch
'recast-navigation': patch
---

Add `TileCache.addTileCopy`, which copies compressed layer data into
Detour-owned memory so callers can safely release their source buffer. TileCache
deserialization now uses the same ownership-safe path.
