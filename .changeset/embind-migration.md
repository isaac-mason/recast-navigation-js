---
"@recast-navigation/wasm": minor
"@recast-navigation/core": minor
---

Migrate the WebAssembly bindings from Emscripten's WebIDL binder to **embind**.

`@recast-navigation/wasm` now generates its bindings with embind (`EMSCRIPTEN_BINDINGS`)
instead of the WebIDL binder + `webidl-dts-gen`. TypeScript definitions are produced by
embind's `--emit-tsd` and a post-processing step. This is an internal change — the
public `@recast-navigation/core` API is unchanged.

Highlights:
- Idiomatic embind mechanisms (`.property`, `enum_`/`constant`, `allow_subclass`, `.delete()`),
  dropping the WebIDL footguns (`wrapPointer`/`getPointer`, manual `destroy`).
- Zero-GC hot paths: crowd per-agent vectors and query results are read via a shared
  wasm scratch buffer into pre-allocated objects (one boundary crossing, no per-frame allocation).
- Smaller JS glue.
