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
yarn run webidl-dts-gen -e -d -i recast-navigation.idl -o ./dist/recast-navigation.d.ts -n Recast

# copy files to dist
cp ./build/recast-navigation.js ./dist/recast-navigation.js

cp ./build/recast-navigation.wasm.js ./dist/recast-navigation.wasm.js
cp ./build/recast-navigation.wasm.wasm ./dist/recast-navigation.wasm.wasm

cp ./build/recast-navigation.esm.wasm-compat.js ./dist/recast-navigation.esm.wasm-compat.js