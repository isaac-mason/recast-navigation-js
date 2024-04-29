---
"@recast-navigation/generators": minor
"@recast-navigation/core": minor
"recast-navigation": minor
---

feat: remove 'Arrays' export, add wrapped array classes

usage changed from:

```ts
import { Arrays } from '@recast-navigation/core';

Arrays.VertsArray
Arrays.TrisArray
Arrays.TriAreasArray
Arrays.ChunkIdsArray
Arrays.TileCacheData
```

to:

```ts
import { VerticesArray, TrianglesArray, TringleAreasArray, ChunkIdsArray, TileCacheData } from '@recast-navigation/core';
```

The `.copy` method now directly copies the data from the source array to the emscripten heap. This should improve performance when copying large arrays.
