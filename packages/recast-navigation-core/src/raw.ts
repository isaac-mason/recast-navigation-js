import Module from '@recast-navigation/wasm';

type ModuleKey = (keyof typeof Module)[][number]

const instances = [
  'Recast',
  'Detour',
  'DetourNavMeshBuilder',
  'DetourTileCacheBuilder',
  'ChunkyTriMesh',
  'NavMeshImporter',
  'NavMeshExporter',
  'CrowdUtils',
] as const satisfies readonly ModuleKey[]

const classes = [
  'rcContext',
  'dtNavMeshParams',
  'dtNavMeshCreateParams',
  'RecastLinearAllocator',
  'RecastFastLZCompressor',
  'rcChunkyTriMesh',
  'TileCacheData',
  'dtTileCacheParams',
  'dtTileCacheLayerHeader',
] as const satisfies readonly ModuleKey[]

const arrays = [
  'IntArray',
  'UnsignedCharArray',
  'UnsignedShortArray',
  'FloatArray',
] as const satisfies readonly ModuleKey[]

type RawType = {
  Module: typeof Module;
  Arrays: {
    [K in typeof arrays[number]]: typeof Module[K];
  },
  isNull: (obj: unknown) => boolean
} & {
  [K in typeof instances[number]]: InstanceType<typeof Module[K]>;
} & {
  [K in typeof classes[number]]: typeof Module[K];
}

/**
 * Lower level bindings for the Recast and Detour libraries.
 * 
 * The `init` function must be called before using the `Raw` api.
 */
export const Raw = ({
  isNull: (obj: unknown) => {
    return Raw.Module.getPointer(obj) === 0;
  },
} satisfies Partial<RawType>) as RawType;

export const init = async () => {
  if (Raw.Module !== undefined) {
    return;
  }

  Raw.Module = await Module();

  for (const instance of instances) {
    (Raw as any)[instance] = new Raw.Module[instance]();
  }

  for (const clazz of classes) {
    (Raw as any)[clazz] = Raw.Module[clazz];
  }

  Raw.Arrays = {} as RawType['Arrays'];
  for (const array of arrays) {
    (Raw.Arrays as any)[array] = Raw.Module[array];
  }
};
