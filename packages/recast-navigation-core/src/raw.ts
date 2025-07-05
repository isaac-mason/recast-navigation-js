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

export const Recast = {} as {
  // constants
  RC_BORDER_REG: number;
  RC_MULTIPLE_REGS: number;
  RC_BORDER_VERTEX: number;
  RC_AREA_BORDER: number;
  RC_CONTOUR_REG_MASK: number;
  RC_MESH_NULL_IDX: number;
  RC_NULL_AREA: number;
  RC_WALKABLE_AREA: number;
  RC_NOT_CONNECTED: number;

  // enums
  RC_CONTOUR_TESS_WALL_EDGES: number;
  RC_CONTOUR_TESS_AREA_EDGES: number;
  RC_LOG_PROGRESS: number;
  RC_LOG_WARNING: number;
  RC_LOG_ERROR: number;
  RC_TIMER_TOTAL: number;
  RC_TIMER_TEMP: number;
  RC_TIMER_RASTERIZE_TRIANGLES: number;
  RC_TIMER_BUILD_COMPACTHEIGHTFIELD: number;
  RC_TIMER_BUILD_CONTOURS: number;
  RC_TIMER_BUILD_CONTOURS_TRACE: number;
  RC_TIMER_BUILD_CONTOURS_SIMPLIFY: number;
  RC_TIMER_FILTER_BORDER: number;
  RC_TIMER_FILTER_WALKABLE: number;
  RC_TIMER_MEDIAN_AREA: number;
  RC_TIMER_FILTER_LOW_OBSTACLES: number;
  RC_TIMER_BUILD_POLYMESH: number;
  RC_TIMER_MERGE_POLYMESH: number;
  RC_TIMER_ERODE_AREA: number;
  RC_TIMER_MARK_BOX_AREA: number;
  RC_TIMER_MARK_CYLINDER_AREA: number;
  RC_TIMER_MARK_CONVEXPOLY_AREA: number;
  RC_TIMER_BUILD_DISTANCEFIELD: number;
  RC_TIMER_BUILD_DISTANCEFIELD_DIST: number;
  RC_TIMER_BUILD_DISTANCEFIELD_BLUR: number;
  RC_TIMER_BUILD_REGIONS: number;
  RC_TIMER_BUILD_REGIONS_WATERSHED: number;
  RC_TIMER_BUILD_REGIONS_EXPAND: number;
  RC_TIMER_BUILD_REGIONS_FLOOD: number;
  RC_TIMER_BUILD_REGIONS_FILTER: number;
  RC_TIMER_BUILD_LAYERS: number;
  RC_TIMER_BUILD_POLYMESHDETAIL: number;
  RC_TIMER_MERGE_POLYMESHDETAIL: number;
  RC_MAX_TIMERS: number;
};

export const Detour = {} as {
  // constants
  DT_FAILURE: number;
  DT_SUCCESS: number;
  DT_IN_PROGRESS: number;
  DT_STATUS_DETAIL_MASK: number;
  DT_WRONG_MAGIC: number;
  DT_WRONG_VERSION: number;
  DT_OUT_OF_MEMORY: number;
  DT_INVALID_PARAM: number;
  DT_BUFFER_TOO_SMALL: number;
  DT_OUT_OF_NODES: number;
  DT_PARTIAL_RESULT: number;
  DT_ALREADY_OCCUPIED: number;
  DT_VERTS_PER_POLYGON: number;
  DT_NAVMESH_MAGIC: number;
  DT_NAVMESH_VERSION: number;
  DT_NAVMESH_STATE_MAGIC: number;
  DT_NAVMESH_STATE_VERSION: number;
  DT_TILECACHE_MAGIC: number;
  DT_TILECACHE_VERSION: number;
  DT_TILECACHE_NULL_AREA: number;
  DT_TILECACHE_WALKABLE_AREA: number;
  DT_TILECACHE_NULL_IDX: number;
  DT_NULL_LINK: number;
  DT_EXT_LINK: number;
  DT_OFFMESH_CON_BIDIR: number;

  // enums
  DT_STRAIGHTPATH_START: number;
  DT_STRAIGHTPATH_END: number;
  DT_STRAIGHTPATH_OFFMESH_CONNECTION: number;
  DT_STRAIGHTPATH_AREA_CROSSINGS: number;
  DT_STRAIGHTPATH_ALL_CROSSINGS: number;
  DT_FINDPATH_ANY_ANGLE: number;
  DT_RAYCAST_USE_COSTS: number;
  DT_CROWDAGENT_STATE_INVALID: number;
  DT_CROWDAGENT_STATE_WALKING: number;
  DT_CROWDAGENT_STATE_OFFMESH: number;
  DT_CROWDAGENT_TARGET_NONE: number;
  DT_CROWDAGENT_TARGET_FAILED: number;
  DT_CROWDAGENT_TARGET_VALID: number;
  DT_CROWDAGENT_TARGET_REQUESTING: number;
  DT_CROWDAGENT_TARGET_WAITING_FOR_QUEUE: number;
  DT_CROWDAGENT_TARGET_WAITING_FOR_PATH: number;
  DT_CROWDAGENT_TARGET_VELOCITY: number;
  DT_COMPRESSEDTILE_FREE_DATA: number;
  DT_TILE_FREE_DATA: number;
};

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

  // recast constants
  Recast.RC_BORDER_REG = Raw.Recast.BORDER_REG;
  Recast.RC_MULTIPLE_REGS = Raw.Recast.MULTIPLE_REGS;
  Recast.RC_BORDER_VERTEX = Raw.Recast.BORDER_VERTEX;
  Recast.RC_AREA_BORDER = Raw.Recast.AREA_BORDER;
  Recast.RC_CONTOUR_REG_MASK = Raw.Recast.CONTOUR_REG_MASK;
  Recast.RC_MESH_NULL_IDX = Raw.Recast.MESH_NULL_IDX;
  Recast.RC_NULL_AREA = Raw.Recast.NULL_AREA;
  Recast.RC_WALKABLE_AREA = Raw.Recast.WALKABLE_AREA;
  Recast.RC_NOT_CONNECTED = Raw.Recast.NOT_CONNECTED;

  // recast enums
  Recast.RC_CONTOUR_TESS_WALL_EDGES = Raw.Module.RC_CONTOUR_TESS_WALL_EDGES;
  Recast.RC_CONTOUR_TESS_AREA_EDGES = Raw.Module.RC_CONTOUR_TESS_AREA_EDGES;
  Recast.RC_LOG_PROGRESS = Raw.Module.RC_LOG_PROGRESS;
  Recast.RC_LOG_WARNING = Raw.Module.RC_LOG_WARNING;
  Recast.RC_LOG_ERROR = Raw.Module.RC_LOG_ERROR;
  Recast.RC_TIMER_TOTAL = Raw.Module.RC_TIMER_TOTAL;
  Recast.RC_TIMER_TEMP = Raw.Module.RC_TIMER_TEMP;
  Recast.RC_TIMER_RASTERIZE_TRIANGLES = Raw.Module.RC_TIMER_RASTERIZE_TRIANGLES;
  Recast.RC_TIMER_BUILD_COMPACTHEIGHTFIELD =
    Raw.Module.RC_TIMER_BUILD_COMPACTHEIGHTFIELD;
  Recast.RC_TIMER_BUILD_CONTOURS = Raw.Module.RC_TIMER_BUILD_CONTOURS;
  Recast.RC_TIMER_BUILD_CONTOURS_TRACE =
    Raw.Module.RC_TIMER_BUILD_CONTOURS_TRACE;
  Recast.RC_TIMER_BUILD_CONTOURS_SIMPLIFY =
    Raw.Module.RC_TIMER_BUILD_CONTOURS_SIMPLIFY;
  Recast.RC_TIMER_FILTER_BORDER = Raw.Module.RC_TIMER_FILTER_BORDER;
  Recast.RC_TIMER_FILTER_WALKABLE = Raw.Module.RC_TIMER_FILTER_WALKABLE;
  Recast.RC_TIMER_MEDIAN_AREA = Raw.Module.RC_TIMER_MEDIAN_AREA;
  Recast.RC_TIMER_FILTER_LOW_OBSTACLES =
    Raw.Module.RC_TIMER_FILTER_LOW_OBSTACLES;
  Recast.RC_TIMER_BUILD_POLYMESH = Raw.Module.RC_TIMER_BUILD_POLYMESH;
  Recast.RC_TIMER_MERGE_POLYMESH = Raw.Module.RC_TIMER_MERGE_POLYMESH;
  Recast.RC_TIMER_ERODE_AREA = Raw.Module.RC_TIMER_ERODE_AREA;
  Recast.RC_TIMER_MARK_BOX_AREA = Raw.Module.RC_TIMER_MARK_BOX_AREA;
  Recast.RC_TIMER_MARK_CYLINDER_AREA = Raw.Module.RC_TIMER_MARK_CYLINDER_AREA;
  Recast.RC_TIMER_MARK_CONVEXPOLY_AREA =
    Raw.Module.RC_TIMER_MARK_CONVEXPOLY_AREA;
  Recast.RC_TIMER_BUILD_DISTANCEFIELD = Raw.Module.RC_TIMER_BUILD_DISTANCEFIELD;
  Recast.RC_TIMER_BUILD_DISTANCEFIELD_DIST =
    Raw.Module.RC_TIMER_BUILD_DISTANCEFIELD_DIST;
  Recast.RC_TIMER_BUILD_DISTANCEFIELD_BLUR =
    Raw.Module.RC_TIMER_BUILD_DISTANCEFIELD_BLUR;
  Recast.RC_TIMER_BUILD_REGIONS = Raw.Module.RC_TIMER_BUILD_REGIONS;
  Recast.RC_TIMER_BUILD_REGIONS_WATERSHED =
    Raw.Module.RC_TIMER_BUILD_REGIONS_WATERSHED;
  Recast.RC_TIMER_BUILD_REGIONS_EXPAND =
    Raw.Module.RC_TIMER_BUILD_REGIONS_EXPAND;
  Recast.RC_TIMER_BUILD_REGIONS_FLOOD = Raw.Module.RC_TIMER_BUILD_REGIONS_FLOOD;
  Recast.RC_TIMER_BUILD_REGIONS_FILTER =
    Raw.Module.RC_TIMER_BUILD_REGIONS_FILTER;
  Recast.RC_TIMER_BUILD_LAYERS = Raw.Module.RC_TIMER_BUILD_LAYERS;
  Recast.RC_TIMER_BUILD_POLYMESHDETAIL =
    Raw.Module.RC_TIMER_BUILD_POLYMESHDETAIL;
  Recast.RC_TIMER_MERGE_POLYMESHDETAIL =
    Raw.Module.RC_TIMER_MERGE_POLYMESHDETAIL;
  Recast.RC_MAX_TIMERS = Raw.Module.RC_MAX_TIMERS;

  // detour constants
  Detour.DT_FAILURE = Raw.Detour.FAILURE;
  Detour.DT_SUCCESS = Raw.Detour.SUCCESS;
  Detour.DT_IN_PROGRESS = Raw.Detour.IN_PROGRESS;
  Detour.DT_STATUS_DETAIL_MASK = Raw.Detour.STATUS_DETAIL_MASK;
  Detour.DT_WRONG_MAGIC = Raw.Detour.WRONG_MAGIC;
  Detour.DT_WRONG_VERSION = Raw.Detour.WRONG_VERSION;
  Detour.DT_OUT_OF_MEMORY = Raw.Detour.OUT_OF_MEMORY;
  Detour.DT_INVALID_PARAM = Raw.Detour.INVALID_PARAM;
  Detour.DT_BUFFER_TOO_SMALL = Raw.Detour.BUFFER_TOO_SMALL;
  Detour.DT_OUT_OF_NODES = Raw.Detour.OUT_OF_NODES;
  Detour.DT_PARTIAL_RESULT = Raw.Detour.PARTIAL_RESULT;
  Detour.DT_ALREADY_OCCUPIED = Raw.Detour.ALREADY_OCCUPIED;
  Detour.DT_VERTS_PER_POLYGON = Raw.Detour.VERTS_PER_POLYGON;
  Detour.DT_NAVMESH_MAGIC = Raw.Detour.NAVMESH_MAGIC;
  Detour.DT_NAVMESH_VERSION = Raw.Detour.NAVMESH_VERSION;
  Detour.DT_NAVMESH_STATE_MAGIC = Raw.Detour.NAVMESH_STATE_MAGIC;
  Detour.DT_NAVMESH_STATE_VERSION = Raw.Detour.NAVMESH_STATE_VERSION;
  Detour.DT_TILECACHE_MAGIC = Raw.Detour.TILECACHE_MAGIC;
  Detour.DT_TILECACHE_VERSION = Raw.Detour.TILECACHE_VERSION;
  Detour.DT_TILECACHE_NULL_AREA = Raw.Detour.TILECACHE_NULL_AREA;
  Detour.DT_TILECACHE_WALKABLE_AREA = Raw.Detour.TILECACHE_WALKABLE_AREA;
  Detour.DT_TILECACHE_NULL_IDX = Raw.Detour.TILECACHE_NULL_IDX;
  Detour.DT_NULL_LINK = Raw.Detour.NULL_LINK;
  Detour.DT_NULL_LINK = Raw.Detour.NULL_LINK;
  Detour.DT_EXT_LINK = Raw.Detour.EXT_LINK;
  Detour.DT_OFFMESH_CON_BIDIR = Raw.Detour.OFFMESH_CON_BIDIR;

  // detour enums
  Detour.DT_STRAIGHTPATH_START = Raw.Module.DT_STRAIGHTPATH_START;
  Detour.DT_STRAIGHTPATH_END = Raw.Module.DT_STRAIGHTPATH_END;
  Detour.DT_STRAIGHTPATH_OFFMESH_CONNECTION =
    Raw.Module.DT_STRAIGHTPATH_OFFMESH_CONNECTION;
  Detour.DT_STRAIGHTPATH_AREA_CROSSINGS =
    Raw.Module.DT_STRAIGHTPATH_AREA_CROSSINGS;
  Detour.DT_STRAIGHTPATH_ALL_CROSSINGS =
    Raw.Module.DT_STRAIGHTPATH_ALL_CROSSINGS;
  Detour.DT_FINDPATH_ANY_ANGLE = Raw.Module.DT_FINDPATH_ANY_ANGLE;
  Detour.DT_RAYCAST_USE_COSTS = Raw.Module.DT_RAYCAST_USE_COSTS;
  Detour.DT_CROWDAGENT_STATE_INVALID = Raw.Module.DT_CROWDAGENT_STATE_INVALID;
  Detour.DT_CROWDAGENT_STATE_WALKING = Raw.Module.DT_CROWDAGENT_STATE_WALKING;
  Detour.DT_CROWDAGENT_STATE_OFFMESH = Raw.Module.DT_CROWDAGENT_STATE_OFFMESH;
  Detour.DT_CROWDAGENT_TARGET_NONE = Raw.Module.DT_CROWDAGENT_TARGET_NONE;
  Detour.DT_CROWDAGENT_TARGET_FAILED = Raw.Module.DT_CROWDAGENT_TARGET_FAILED;
  Detour.DT_CROWDAGENT_TARGET_VALID = Raw.Module.DT_CROWDAGENT_TARGET_VALID;
  Detour.DT_CROWDAGENT_TARGET_REQUESTING =
    Raw.Module.DT_CROWDAGENT_TARGET_REQUESTING;
  Detour.DT_CROWDAGENT_TARGET_WAITING_FOR_QUEUE =
    Raw.Module.DT_CROWDAGENT_TARGET_WAITING_FOR_QUEUE;
  Detour.DT_CROWDAGENT_TARGET_WAITING_FOR_PATH =
    Raw.Module.DT_CROWDAGENT_TARGET_WAITING_FOR_PATH;
  Detour.DT_CROWDAGENT_TARGET_VELOCITY =
    Raw.Module.DT_CROWDAGENT_TARGET_VELOCITY;
  Detour.DT_COMPRESSEDTILE_FREE_DATA = Raw.Module.DT_COMPRESSEDTILE_FREE_DATA;
  Detour.DT_TILE_FREE_DATA = Raw.Module.DT_TILE_FREE_DATA;
};
