#!/bin/bash

set -e

# cd to script directory
cd "$(dirname "$0")"

# cleanup
rm -rf ./dist

# build api docs
echo "Building API docs..."
(cd ../apps/docs && pnpm build)

# build examples
echo "Building Examples..."
(cd ../examples && pnpm build)

# build website
echo "Building Website..."
pnpm build

# copy api docs to ./dist/docs
echo "Copying API docs..."
cp -r ../apps/docs/dist ./dist/docs

# copy examples to ./dist/examples
echo "Copying Examples..."
cp -r ../examples/dist ./dist/examples

echo "Build complete! Output in ./dist"
