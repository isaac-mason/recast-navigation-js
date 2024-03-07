#!/bin/sh

# create directories
mkdir -p ./build
mkdir -p dist

# clone recast navigation library
[ ! -d "recastnavigation" ] && git clone https://github.com/isaac-mason/recastnavigation.git
(cd recastnavigation && git checkout '599fd0f023181c0a484df2a18cf1d75a3553852e')

# emscripten builds
emcmake cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build

# generate typescript definitions
yarn run webidl-dts-gen -e -d -i recast-navigation.idl -o ./dist/recast-navigation.d.ts -n Recast

# copy files to dist
cp ./build/recast-navigation.* ./dist/
