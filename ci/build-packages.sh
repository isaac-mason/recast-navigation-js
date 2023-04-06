#!/bin/bash

yarn

bash ./ci/install-emsdk.sh

source ./emsdk/emsdk_env.sh

yarn build:packages
