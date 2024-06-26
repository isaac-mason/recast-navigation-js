---
"@recast-navigation/core": minor
"recast-navigation": minor
---

feat: remove 'range' array utility

The range utility was only used in examples, not in the core library.

If you were using it, you can easily replace it with a simple code snippet.

```ts
function range(n: number) {
  return [...Array(n)].map((_, i) => i);
};
```