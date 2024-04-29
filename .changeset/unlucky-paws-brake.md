---
"@recast-navigation/core": minor
"recast-navigation": minor
---

feat: simplify return type of NavMesh getTileAndPolyByRef, getTileAndPolyByRefUnsafe

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