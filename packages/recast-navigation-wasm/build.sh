#!/bin/sh

# sh build.sh [release|debug]

if [ -z $1 ] 
then
	BUILD_TYPE=release
else
	BUILD_TYPE=$1
	shift
fi

rm -rf build dist

# create directories
mkdir -p build
mkdir -p dist

# clone recast navigation library
# [ ! -d "recastnavigation" ] && git clone https://github.com/isaac-mason/recastnavigation.git
# (cd recastnavigation && git checkout '599fd0f023181c0a484df2a18cf1d75a3553852e')
[ ! -d "recastnavigation" ] && git clone https://github.com/rob-myers/recastnavigation.git
# (cd recastnavigation && git checkout 'feat/expose-off-mesh-anim')
(cd recastnavigation && git checkout 'main' && git pull)

# emscripten builds
emcmake cmake -B build -DCMAKE_BUILD_TYPE=$BUILD_TYPE
cmake --build build

# generate typescript definitions
yarn run webidl-dts-gen -e -d -i recast-navigation.idl -o ./dist/recast-navigation.d.ts -n Recast

# copy files to dist
cp ./build/recast-navigation.* ./dist/
