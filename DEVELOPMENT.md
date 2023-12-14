# Development

The `recast-navigation-js` repository is structured as a yarn monorepo. You will find all published packages inside `./packages`, reference examples in `./examples`, and deployed applications in `./apps`.

## Prerequisites

### Node Installation

**This project uses node 18.**

If you don't already use a node version manager. Give nvm a try if you don't already have one.

https://github.com/nvm-sh/nvm

### Yarn Installation

**This project uses yarn 3.**

If you have Corepack enabled, you should be able to use this project's yarn version without doing anything special. If you don't have Corepack enabled, you can enable it by running the following:

```sh
> corepack enable
```

### Python Installation

**This project uses Python 3.11.5.**

A python version manager will make your life easier. Give pyenv a try if you don't already have one.

https://github.com/pyenv/pyenv

### Emscripten Installation

**This project uses Emsdk v3.1.44.**

On mac / linux, you can install emscripten with the following instructions.

```sh
# enter a directory you're happy to put emscripten in
cd ~/Development

# Clone the emsdk repo
git clone https://github.com/emscripten-core/emsdk.git

# Enter that directory
cd emsdk

# Download and install recast-navigation's required version of emscripten
./emsdk install 3.1.44

# Activate the emsdk version you just installed
./emsdk activate 3.1.44

# Activate PATH and other environment variables in the current terminal
source ./emsdk_env.sh
```

For the latest installation instructions, as well as windows installation instructions, see the emscripten website: https://emscripten.org/docs/getting_started/downloads.html

After you have installed emscripten, you can sanity check that you have the correct version installed by running:

```sh
> emcc --version
```

## Building

Once you have the above installed, run the following to install dependencies and build all packages:

```sh
> yarn install
> yarn build
```

To run the storybooks, run the following:

```sh
cd packages/recast-navigation
yarn storybook
```
