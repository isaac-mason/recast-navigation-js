import Recast from '@recast-navigation/wasm';

export const Raw: {
  Recast: typeof Recast;
} = {
  Recast: null!,
};

export const init = async () => {
  if (Raw.Recast !== null) {
    return;
  }

  Raw.Recast = await Recast();
};
