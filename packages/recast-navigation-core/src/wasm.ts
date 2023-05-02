import Recast from '@recast-navigation/wasm';

export const Wasm: {
  Recast: typeof Recast;
} = {
  Recast: null!,
};

export const init = async () => {
  if (Wasm.Recast !== null) {
    return;
  }

  Wasm.Recast = await Recast();
};
