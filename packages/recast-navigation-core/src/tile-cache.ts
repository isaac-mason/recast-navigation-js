import { NavMeshCreateParams } from './detour';
import { NavMesh } from './nav-mesh';
import { Raw } from './raw';
import type R from './raw-module';
import { vec3, Vector3 } from './utils';

export type ObstacleRef = R.dtObstacleRef;

export type BoxObstacle = {
  type: 'box';
  ref: ObstacleRef;
  position: Vector3;
  extent: Vector3;
  angle: number;
};

export type CylinderObstacle = {
  type: 'cylinder';
  ref: ObstacleRef;
  position: Vector3;
  radius: number;
  height: number;
};

export type AddObstacleResult<T> = {
  success: true;
  status: number;
  obstacle: T;
} | {
  success: false;
  status: number;
  obstacle?: T;
};

export type RemoveObstacleResult = {
  success: boolean;
  status: number;
};

export type Obstacle = BoxObstacle | CylinderObstacle;

export type TileCacheParamsType = {
  orig: ReadonlyArray<number>;
  cs: number;
  ch: number;
  width: number;
  height: number;
  walkableHeight: number;
  walkableRadius: number;
  walkableClimb: number;
  maxSimplificationError: number;
  maxTiles: number;
  maxObstacles: number;
};

export class DetourTileCacheParams {
  constructor(public raw: R.dtTileCacheParams) {}

  static create(config: TileCacheParamsType): DetourTileCacheParams {
    const tileCacheParams = new Raw.Module.dtTileCacheParams();

    tileCacheParams.set_orig(0, config.orig[0]);
    tileCacheParams.set_orig(1, config.orig[1]);
    tileCacheParams.set_orig(2, config.orig[2]);

    tileCacheParams.set_cs(config.cs);
    tileCacheParams.set_ch(config.ch);
    tileCacheParams.set_width(config.width);
    tileCacheParams.set_height(config.height);
    tileCacheParams.set_walkableHeight(config.walkableHeight);
    tileCacheParams.set_walkableRadius(config.walkableRadius);
    tileCacheParams.set_walkableClimb(config.walkableClimb);
    tileCacheParams.set_maxSimplificationError(config.maxSimplificationError);
    tileCacheParams.set_maxTiles(config.maxTiles);
    tileCacheParams.set_maxObstacles(config.maxObstacles);

    return new DetourTileCacheParams(tileCacheParams);
  }
}

export type TileCacheUpdateResult = {
  success: boolean;
  status: number;
  upToDate: boolean;
};

export class TileCache {
  raw: R.TileCache;

  obstacles: Map<ObstacleRef, Obstacle> = new Map();

  constructor(raw?: R.TileCache) {
    this.raw = raw ?? new Raw.Module.TileCache();
  }

  /**
   * Initialises the TileCache
   * @param params
   */
  init(
    params: DetourTileCacheParams,
    alloc: R.RecastLinearAllocator,
    compressor: R.RecastFastLZCompressor,
    meshProcess: TileCacheMeshProcess
  ) {
    return this.raw.init(params.raw, alloc, compressor, meshProcess.raw);
  }

  /**
   * Updates the tile cache by rebuilding tiles touched by unfinished obstacle requests.
   *
   * After adding or removing obstacles you can call `tileCache.update(navMesh)` to rebuild navmesh tiles.
   *
   * Adding or removing an obstacle will internally create an "obstacle request".
   * TileCache supports queuing up to 64 obstacle requests.
   *
   * The `tileCache.update` method returns `upToDate`, whether the tile cache is fully up to date with obstacle requests and tile rebuilds.
   * Each update call processes up to 64 tiles touched by added or removed obstacles.
   * If the tile cache isn't up to date another call will continue processing obstacle requests and tile rebuilds; otherwise it will have no effect.
   *
   * If not many obstacle requests occur between updates, an easy pattern is to call `tileCache.update` periodically, such as every game update.
   * If many obstacle requests have been made and you need to avoid reaching the 64 obstacle request limit, you can call `tileCache.update` multiple times, bailing out when `upToDate` is true or after a maximum number of updates.
   * 
   * @example
   * ```ts
   * const { success, status, upToDate } = tileCache.update(navMesh);
   * ```
   */
  update(navMesh: NavMesh): TileCacheUpdateResult {
    const { status, upToDate } = this.raw.update(navMesh.raw);

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      upToDate,
    };
  }

  /**
   * Creates a cylinder obstacle and adds it to the navigation mesh.
   */
  addCylinderObstacle(
    position: Vector3,
    radius: number,
    height: number
  ): AddObstacleResult<CylinderObstacle> {
    const result = this.raw.addCylinderObstacle(
      vec3.toRaw(position),
      radius,
      height
    );

    if (result.status !== Raw.Detour.SUCCESS) {
      return {
        success: false,
        status: result.status,
      };
    }

    const ref = result.ref;

    const obstacle: CylinderObstacle = {
      type: 'cylinder',
      ref,
      position,
      radius,
      height,
    };

    this.obstacles.set(ref, obstacle);

    return {
      success: true,
      status: result.status,
      obstacle,
    };
  }

  /**
   * Creates a box obstacle and adds it to the navigation mesh.
   */
  addBoxObstacle(
    position: Vector3,
    extent: Vector3,
    angle: number
  ): AddObstacleResult<BoxObstacle> {
    const result = this.raw.addBoxObstacle(
      vec3.toRaw(position),
      vec3.toRaw(extent),
      angle
    );

    if (result.status !== Raw.Detour.SUCCESS) {
      return {
        success: false,
        status: result.status,
      };
    }

    const ref = result.ref;

    const obstacle: BoxObstacle = {
      type: 'box',
      ref,
      position,
      extent,
      angle,
    };

    this.obstacles.set(ref, obstacle);

    return {
      success: true,
      status: result.status,
      obstacle,
    };
  }

  /**
   * Removes an obstacle from the navigation mesh.
   */
  removeObstacle(obstacle: Obstacle | ObstacleRef): RemoveObstacleResult {
    let ref: ObstacleRef;

    if (typeof obstacle === 'object') {
      ref = (obstacle as Obstacle).ref;
    } else {
      ref = obstacle;
    }

    this.obstacles.delete(ref);

    const status = this.raw.removeObstacle(ref);

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
    };
  }

  addTile(
    data: R.UnsignedCharArray,
    flags: number = Raw.Module.DT_COMPRESSEDTILE_FREE_DATA
  ): R.TileCacheAddTileResult {
    return this.raw.addTile(data, flags);
  }

  buildNavMeshTile(ref: R.dtCompressedTileRef, navMesh: NavMesh) {
    return this.raw.buildNavMeshTile(ref, navMesh.raw);
  }

  buildNavMeshTilesAt(tx: number, ty: number, navMesh: NavMesh) {
    return this.raw.buildNavMeshTilesAt(tx, ty, navMesh.raw);
  }

  destroy(): void {
    this.raw.destroy();
  }
}

export class TileCacheMeshProcess {
  raw: R.TileCacheMeshProcess;

  constructor(
    process: (
      navMeshCreateParams: NavMeshCreateParams,
      polyAreasArray: R.UnsignedCharArray,
      polyFlagsArray: R.UnsignedShortArray
    ) => void
  ) {
    this.raw = new Raw.Module.TileCacheMeshProcess();

    this.raw.process = (
      paramsPtr: number,
      polyAreasArrayPtr: number,
      polyFlagsArrayPtr: number
    ) => {
      const params = new NavMeshCreateParams(
        Raw.Module.wrapPointer(paramsPtr, Raw.Module.dtNavMeshCreateParams)
      );

      const polyAreasArray = Raw.Module.wrapPointer(
        polyAreasArrayPtr,
        Raw.Module.UnsignedCharArray
      );

      const polyFlagsArray = Raw.Module.wrapPointer(
        polyFlagsArrayPtr,
        Raw.Module.UnsignedShortArray
      );

      process(params, polyAreasArray, polyFlagsArray);
    };
  }
}

export const buildTileCacheLayer = (
  comp: R.RecastFastLZCompressor,
  header: R.dtTileCacheLayerHeader,
  heights: R.UnsignedCharArray,
  areas: R.UnsignedCharArray,
  cons: R.UnsignedCharArray,
  tileCacheData: R.UnsignedCharArray
): number => {
  return Raw.DetourTileCacheBuilder.buildTileCacheLayer(
    comp,
    header,
    heights,
    areas,
    cons,
    tileCacheData
  );
};
