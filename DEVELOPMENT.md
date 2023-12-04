# Development

The `recast-navigation-js` repository is structured as a monorepo. You will find all published packages inside `./packages`, reference examples in `./examples`, and deployed applications in `./apps`.

Before building, ensure you have the following installed:

- Node 18
- Python 3.10.5
- Emsdk v3.1.44

See the emscripten website for emsdk installation instructions: https://emscripten.org/docs/getting_started/downloads.html

To build the project, run the following:

```sh
> yarn install
> yarn build
```