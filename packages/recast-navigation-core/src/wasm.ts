import Recast from '@recast-navigation/wasm';

export const Wasm: {
  Recast: typeof Recast;
  DtStatus: Recast.DtStatus;
} = {
  Recast: null!,
  DtStatus: null!,
};

export const init = async () => {
  if (Wasm.Recast !== null) {
    return;
  }

  Wasm.Recast = await Recast();
  Wasm.DtStatus = new Wasm.Recast.DtStatus();
};
