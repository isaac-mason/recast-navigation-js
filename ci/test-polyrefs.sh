#!/bin/bash

set -euo pipefail

WASM_PACKAGE="packages/recast-navigation-wasm"
CORE_MODULE="packages/recast-navigation-core/dist/index.mjs"
GENERATORS_MODULE="packages/recast-navigation-generators/dist/index.mjs"
POLYREF64_BUILD="$WASM_PACKAGE/build-polyref64-ci"

if [[ -z "${EMSDK:-}" ]]; then
  source ./emsdk/emsdk_env.sh
fi

ctest --test-dir "$WASM_PACKAGE/build" --output-on-failure

emcmake cmake \
  -S "$WASM_PACKAGE" \
  -B "$POLYREF64_BUILD" \
  -DCMAKE_BUILD_TYPE=release \
  -DRECASTNAVIGATION_DT_POLYREF64=ON
cmake --build "$POLYREF64_BUILD" --parallel
ctest --test-dir "$POLYREF64_BUILD" --output-on-failure

node "$WASM_PACKAGE/../recast-navigation-core/tests/polyref-core-smoke.mjs" \
  32 \
  "$CORE_MODULE" \
  "$WASM_PACKAGE/dist/recast-navigation.wasm-compat.js" \
  "$GENERATORS_MODULE"

node "$WASM_PACKAGE/../recast-navigation-core/tests/polyref-core-smoke.mjs" \
  64 \
  "$CORE_MODULE" \
  "$POLYREF64_BUILD/recast-navigation.wasm-compat.js" \
  "$GENERATORS_MODULE"
