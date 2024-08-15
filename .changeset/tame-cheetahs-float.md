---
"@recast-navigation/three": minor
---

feat: remove resize from DebugDrawer, three LineMaterial no longer requires manually setting resolution

If using an older version of three.js, you may need to manually set the resolution of the LineMaterial on `debugDrawer.lineMaterial`.
