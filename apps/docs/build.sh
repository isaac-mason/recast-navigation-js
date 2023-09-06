#!/bin/sh

mkdir -p ./tmp

remove_start_marker="<!-- REMOVE-FROM-DOCS-START -->"
remove_end_marker="<!-- REMOVE-FROM-DOCS-END -->"
sed "/$remove_start_marker/,/$remove_end_marker/d" "./../../packages/recast-navigation/README.md" > "./tmp/README.md"

typedoc --tsconfig ../../packages/recast-navigation/tsconfig.json

cp ../../packages/recast-navigation/cover.png ./dist/cover.png