# DT_POLYREF64 WASM spike

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
`bigint` values. Callers must normalize at the boundary:

```js
const unsignedRef = BigInt.asUintN(64, wasmRef);
const wasmArgument = BigInt.asIntN(64, unsignedRef);
```

This is a raw-WASM proof, not yet a production package:

- the TypeScript core wrappers still model refs as `number`;
- upstream `webidl-dts-gen` cannot parse `unsigned long long[]`, so the
  64-bit package needs a BigInt-aware declaration generator or checked-in
  declaration surface before it can be published;
- the server has not yet been switched to a monolithic 64-bit consumer;
- direct `MSET` serialization has a separate version for 64-bit tile refs,
  while compressed `TSET` data remains the intended migration input; and
- the five known TileCache materialization failures in the current Z1 data
  still need local geometry/region repair because wider refs do not fix bad
  compressed layers.

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
