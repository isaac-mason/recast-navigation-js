---
"recast-navigation": minor
"@recast-navigation/core": minor
"@recast-navigation/wasm": minor
---

feat(NavMeshQuery): add findPolysAroundCircle and queryPolygons (@rob-myers)

NavMeshQuery now supports:

```ts
navMeshQuery.findPolysAroundCircle(startRef: number, centerPos: Vector3, radius: number, filter?: QueryFilter, maxResult?: number): {
    success: boolean;
    status: number;
    resultRefs: number[];
    resultParents: number[];
    resultCost: number;
    resultCount: number;
}
```

```ts
navMeshQuery.queryPolygons(center: Vector3, halfExtents: Vector3, filter?: QueryFilter, maxPolys?: number): {
    success: boolean;
    status: number;
    polyRefs: number[];
    polyCount: number;
}
```

See the new "Click Nearby Polygons" example: https://recast-navigation-js.isaacmason.com/?path=/story/navmeshquery-clicknearbypolygons--click-nearby-polygons
