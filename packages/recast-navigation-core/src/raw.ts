import RawModule from './raw-module';
import type { Pretty } from './types';

type ModuleKey = (keyof typeof RawModule)[][number];

const instances = [
  'Recast',
  'Detour',
  'DetourNavMeshBuilder',
  'DetourTileCacheBuilder',
  'ChunkyTriMesh',
  'NavMeshImporter',
  'NavMeshExporter',
  'CrowdUtils',
] as const satisfies readonly ModuleKey[];

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
  'Vec3',
  'Vec2',
  'BoolRef',
  'IntRef',
  'UnsignedIntRef',
  'UnsignedCharRef',
  'UnsignedShortRef',
  'FloatRef',
] as const satisfies readonly ModuleKey[];

const arrays = [
  'IntArray',
  'UnsignedIntArray',
  'UnsignedCharArray',
  'UnsignedShortArray',
  'FloatArray',
] as const satisfies readonly ModuleKey[];

type RawApi = Pretty<
  {
    Module: typeof RawModule;
    Arrays: {
      [K in (typeof arrays)[number]]: (typeof RawModule)[K];
    };
    isNull: (obj: unknown) => boolean;
  } & {
    [K in (typeof instances)[number]]: InstanceType<(typeof RawModule)[K]>;
  } & {
    [K in (typeof classes)[number]]: (typeof RawModule)[K];
  }
>;

/**
 * Lower level bindings for the Recast and Detour libraries.
 *
 * The `init` function must be called before using the `Raw` api.
 */
export const Raw = {
  isNull: (obj: unknown) => {
    return Raw.Module.getPointer(obj) === 0;
  },
} satisfies Partial<RawApi> as RawApi;

export const init = async () => {
  if (Raw.Module !== undefined) {
    return;
  }

  Raw.Module = await RawModule();

  for (const instance of instances) {
    (Raw as any)[instance] = new Raw.Module[instance]();
  }

  for (const clazz of classes) {
    (Raw as any)[clazz] = Raw.Module[clazz];
  }

  Raw.Arrays = {} as RawApi['Arrays'];
  for (const array of arrays) {
    (Raw.Arrays as any)[array] = Raw.Module[array];
  }
};
