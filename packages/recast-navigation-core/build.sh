#!/bin/sh

# create directories
mkdir -p ./build
mkdir -p dist

# clone recast navigation library
[ ! -d "recastnavigation" ] && git clone https://github.com/recastnavigation/recastnavigation.git
(cd recastnavigation && git checkout c5cbd53024c8a9d8d097a4371215e3342d2fdc87)

# emscripten builds
emcmake cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build

# generate typescript definitions
yarn run webidl-dts-gen -e -d -i recast.idl -o ./dist/recast.d.ts -n Recast

# copy files to dist
cp ./build/recast.js ./dist/recast.js

cp ./build/recast.wasm.js ./dist/recast.wasm.js
cp ./build/recast.wasm.wasm ./dist/recast.wasm.wasm

cp ./build/recast.wasm-compat.js ./dist/recast.wasm-compat.js