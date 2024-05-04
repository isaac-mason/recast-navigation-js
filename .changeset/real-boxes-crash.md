---
"@recast-navigation/core": minor
"recast-navigation": minor
---

feat: support separate wasm file as well as inlined wasm file

Progresses https://github.com/isaac-mason/recast-navigation-js/issues/164

Now `init` can be optionally passed a default import of one of the `@recast-navigation/wasm` packages.

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

await init();
```
