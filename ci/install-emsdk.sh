#!/bin/bash

git clone https://github.com/emscripten-core/emsdk.git

cd emsdk

./emsdk install 4.0.10
./emsdk activate 4.0.10
