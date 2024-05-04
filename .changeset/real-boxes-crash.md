---
"@recast-navigation/core": minor
"recast-navigation": minor
---

feat: support separate wasm file as well as inlined wasm file

Progresses https://github.com/isaac-mason/recast-navigation-js/issues/164

Now `init` can be optionally passed a default import of one of the `@recast-navigation/wasm` packages.

The `@recast-navigation/wasm` package is no longer included in the `@recast-navigation/core` package. If nothing is passed to `init`, the inlined wasm-compat flavor is dynamically imported.

Note that the other `wasm` flavor currently does not support node.js environments.

```ts
import { init } from 'recast-navigation';

// import the 'wasm' flavor - has a separate wasm file, not inlined
import RecastWasm from '@recast-navigation/wasm/wasm';

await init(RecastWasm);
```

It's still possible to use the inlined wasm flavor by not passing anything to `init` as before.

```ts
import { init } from 'recast-navigation';

// internally dynamically imports `@recast-navigation/wasm`
await init();
```
