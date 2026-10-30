#!/bin/bash

pnpm install --frozen-lockfile

bash ./ci/install-emsdk.sh

source ./emsdk/emsdk_env.sh

pnpm build
