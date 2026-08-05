---
'@recast-navigation/wasm': patch
'recast-navigation': patch
---

Fix `Crowd.getActiveAgentCount()` so it counts active slots without asking
Detour to write agent pointers through a null output array.
