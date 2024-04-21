---
"@recast-navigation/core": minor
"recast-navigation": minor
---

feat(NavMeshQuery): expose success and error information for computePath

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
