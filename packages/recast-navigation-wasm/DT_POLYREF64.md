# DT_POLYREF64 WASM builds

This package has an opt-in `RECASTNAVIGATION_DT_POLYREF64` CMake build mode.
The default remains the existing 32-bit Detour ABI.

The 64-bit mode:

- compiles Detour, DetourCrowd, TileCache, the wrapper library, and generated
  WebIDL glue with `DT_POLYREF64`;
- enables Emscripten `WASM_BIGINT`;
- exposes polygon and navmesh tile refs as JavaScript `bigint` values;
- uses 64-bit ref wrappers for query result arrays and out parameters; and
- runs the same ABI smoke test as the 32-bit build, including exact values
  above `2^53` and the full unsigned 64-bit bit pattern.

WebIDL currently exposes high-bit unsigned values as signed JavaScript
`bigint` values. The core package normalizes those values at its public
boundary. Raw-WASM callers must normalize explicitly:

```js
const unsignedRef = BigInt.asUintN(64, wasmRef);
const wasmArgument = BigInt.asIntN(64, unsignedRef);
```

The high-level core API supports either runtime through the `PolyRef` type
(`number | bigint`) and detects the loaded ABI at initialization. The published
WASM package remains the existing 32-bit build by default. A 64-bit artifact is
an opt-in source build and therefore has two packaging caveats:

- upstream `webidl-dts-gen` cannot parse `unsigned long long[]`, so the
  generated raw declaration surface for a separately published 64-bit WASM
  package needs a BigInt-aware generator or checked-in declarations; and
- direct navmesh serialization uses a distinct version for 64-bit tile refs,
  so 32-bit and 64-bit direct artifacts cannot be silently interchanged.

Compressed TileCache data contains no polygon references and can be imported
into either runtime. Wider references increase capacity; they do not repair
invalid compressed layers or disconnected navigation topology.

Build and test both modes from an Emscripten environment:

```sh
emcmake cmake -S . -B build-polyref32 -DCMAKE_BUILD_TYPE=release
cmake --build build-polyref32 --parallel
ctest --test-dir build-polyref32 --output-on-failure

emcmake cmake -S . -B build-polyref64 -DCMAKE_BUILD_TYPE=release \
  -DRECASTNAVIGATION_DT_POLYREF64=ON
cmake --build build-polyref64 --parallel
ctest --test-dir build-polyref64 --output-on-failure
```

After the normal package build, `yarn test:polyrefs` builds the 64-bit variant
and runs the same raw ABI and high-level core API smoke tests against both
32-bit and 64-bit runtimes.
