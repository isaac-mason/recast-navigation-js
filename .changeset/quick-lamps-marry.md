---
'@recast-navigation/core': patch
---

fix: make `@recast-navigation/wasm` a dev dependency of `@recast-navigation/core`.

`@recast-navigation/wasm` is inlined in `@recast-navigation/core`'s build output, so it doesn't need to be a dependency of `@recast-navigation/core`.
