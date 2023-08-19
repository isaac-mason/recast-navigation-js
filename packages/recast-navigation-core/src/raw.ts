import Module from '@recast-navigation/wasm';

/**
 * Lower level bindings for the Recast and Detour libraries.
 * 
 * The `init` function must be called before using the `Raw` api.
 */
export const Raw = {
  Module: null! as typeof Module,
  Recast: null! as Module.Recast,
  Detour: null! as Module.Detour,
  DetourNavMeshBuilder: null! as Module.DetourNavMeshBuilder,
  DetourTileCacheBuilder: null! as Module.DetourTileCacheBuilder,
  ChunkyTriMesh: null! as Module.ChunkyTriMesh,
  NavMeshImporter: null! as Module.NavMeshImporter,
  NavMeshExporter: null! as Module.NavMeshExporter,
  Arrays: null! as {
    IntArray: typeof Module.IntArray;
    UnsignedCharArray: typeof Module.UnsignedCharArray;
    UnsignedShortArray: typeof Module.UnsignedShortArray;
    FloatArray: typeof Module.FloatArray;
  },
};

export const init = async () => {
  if (Raw.Module !== null) {
    return;
  }

  Raw.Module = await Module();
  Raw.Recast = new Raw.Module.Recast();
  Raw.Detour = new Raw.Module.Detour();
  Raw.DetourNavMeshBuilder = new Raw.Module.DetourNavMeshBuilder();
  Raw.DetourTileCacheBuilder = new Raw.Module.DetourTileCacheBuilder();
  Raw.ChunkyTriMesh = new Raw.Module.ChunkyTriMesh();
  Raw.NavMeshImporter = new Raw.Module.NavMeshImporter();
  Raw.NavMeshExporter = new Raw.Module.NavMeshExporter();
  Raw.Arrays = {
    IntArray: Raw.Module.IntArray,
    UnsignedCharArray: Raw.Module.UnsignedCharArray,
    UnsignedShortArray: Raw.Module.UnsignedShortArray,
    FloatArray: Raw.Module.FloatArray,
  };
};
