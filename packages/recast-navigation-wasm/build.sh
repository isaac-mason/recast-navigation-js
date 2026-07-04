#!/bin/sh

# sh build.sh [release|debug]

if [ -z $1 ] 
then
	BUILD_TYPE=release
else
	BUILD_TYPE=$1
	shift
fi

# create directories
mkdir -p ./build
mkdir -p dist

# clone recast navigation library
[ ! -d "recastnavigation" ] && git clone https://github.com/isaac-mason/recastnavigation.git
(cd recastnavigation && git checkout '599fd0f023181c0a484df2a18cf1d75a3553852e')

# emscripten builds (embind bindings + types via --emit-tsd + postprocess-tsd.mjs)
emcmake cmake -B build -DCMAKE_BUILD_TYPE=$BUILD_TYPE
cmake --build build

# copy artifacts to dist (the .d.ts is produced by the CMake post-process step)
cp ./build/recast-navigation.wasm.js ./dist/
cp ./build/recast-navigation.wasm.wasm ./dist/
cp ./build/recast-navigation.wasm-compat.js ./dist/
cp ./build/recast-navigation.d.ts ./dist/
