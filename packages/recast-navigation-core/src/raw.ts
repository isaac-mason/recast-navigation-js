import type {
  default as Module,
  default as RawModule,
} from '@recast-navigation/wasm';
import type { Pretty } from './types';

export type { RawModule };

type ModuleKey = (keyof typeof RawModule)[][number];

const instances = [
  'Recast',
  'Detour',
  'DetourNavMeshBuilder',
  'DetourTileCacheBuilder',
  'NavMeshImporter',
  'NavMeshExporter',
  'CrowdUtils',
  'ChunkyTriMeshUtils',
  'RecastDebugDraw',
  'DetourDebugDraw',
] as const satisfies readonly ModuleKey[];

const classes = [
  'rcConfig',
  'rcContext',
  'dtNavMeshParams',
  'dtNavMeshCreateParams',
  'RecastLinearAllocator',
  'RecastFastLZCompressor',
  'rcChunkyTriMesh',
  'dtTileCacheParams',
  'dtTileCacheLayerHeader',
  'Vec3',
  'BoolRef',
  'IntRef',
  'UnsignedIntRef',
  'UnsignedCharRef',
  'UnsignedShortRef',
  'FloatRef',
  'IntArray',
  'UnsignedIntArray',
  'UnsignedCharArray',
  'UnsignedShortArray',
  'FloatArray',
] as const satisfies readonly ModuleKey[];

type RawApi = Pretty<
  {
    Module: typeof RawModule;
    isNull: (obj: unknown) => boolean;
    destroy: (obj: unknown) => void;
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
  destroy: (obj: unknown) => {
    Raw.Module.destroy(obj);
  },
} satisfies Partial<RawApi> as RawApi;

export const init = async (impl?: typeof Module) => {
  if (Raw.Module !== undefined) {
    return;
  }

  if (impl) {
    Raw.Module = await impl();
  } else {
    const defaultExport = (await import('@recast-navigation/wasm')).default;
    Raw.Module = await defaultExport();
  }

  for (const instance of instances) {
    (Raw as any)[instance] = new Raw.Module[instance]();
  }

  for (const clazz of classes) {
    (Raw as any)[clazz] = Raw.Module[clazz];
  }
};
