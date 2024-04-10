---
"@recast-navigation/core": minor
"@recast-navigation/wasm": minor
"recast-navigation": minor
---

feat(TileCache): expose detour result when adding and removing obstacles

Previously `addBoxObstacle` and `addCylinderObstacle` would return the obstacle object. Now they return a result object with `success` and `status` properties explaining the result of the operation, and a `obstacle` property containing the obstacle object if the operation was successful.

```ts
const obstacle = tileCache.addBoxObstacle(position, extent, angle);
```

```ts
const { success, status, obstacle } = tileCache.addBoxObstacle(position, extent, angle);
```

Additionally `removeObstacle` now returns a result object with `success` and `status` properties.

```ts
const { success, status } = tileCache.removeObstacle(obstacle);
```
