#!/bin/sh

# create build directory
mkdir -p ./build

# clone recast navigation library
git clone https://github.com/recastnavigation/recastnavigation.git
(cd recastnavigation && git checkout c5cbd53024c8a9d8d097a4371215e3342d2fdc87)

# build recast navigation library
emcmake cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build

# generate typescript definitions
yarn webidl2ts -e -i recast.idl -o ./build/recast.d.ts -n Recast

# copy to dist
mkdir -p dist
cp ./build/recast.js ./dist/recast.js
cp ./build/recast.d.ts ./dist/recast.d.ts
