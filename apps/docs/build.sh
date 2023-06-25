#!/bin/sh

mkdir -p ./tmp

cat ../../packages/recast-navigation/README.md ../../packages/recast-navigation-three/README.md > ./tmp/README.md

typedoc --tsconfig ../../packages/recast-navigation/tsconfig.json
