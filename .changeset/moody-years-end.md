---
'recast-navigation': minor
'@recast-navigation/generators': minor
---

feat: add optional 'bounds' config to navmesh generators

If provided, it will be used as the bounds for the navmesh heightfield during generation. If not provided, the bounds will be calculated from the input geometry. If the bounds are known ahead of time, providing them can save some time during generation.
