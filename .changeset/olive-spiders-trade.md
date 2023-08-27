---
'@recast-navigation/core': patch
'@recast-navigation/wasm': patch
---

fix: raw types not resolving, not being included in docs

Despite the fact that @recast-navigation/wasm is bundled into the core package, it still needs to be listed as a regular dependency so the types are available to the core package.
