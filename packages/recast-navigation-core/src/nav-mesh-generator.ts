import type R from '@recast-navigation/wasm';
import { finalizer } from './finalizer';
import { NavMesh } from './nav-mesh';
import { TileCache } from './tile-cache';
import { emscripten } from './utils';
import { Wasm } from './wasm';
import {
  rcChunkyTriMesh,
  rcCompactHeightfield,
  rcContourSet,
  rcHeightfield,
  rcHeightfieldLayerSet,
} from './wrappers';

export type NavMeshConfig = {
  /**
   * The size of the non-navigable border around the heightfield.
   * [Limit: >=0] [Units: vx]
   * @default 0
   */
  borderSize: number;

  /**
   * The width/height size of tile's on the xz-plane.
   * [Limit: >= 0] [Units: vx]
   *
   * If tileSize is provided, a tiled navmesh will be created.
   * If tileSize is not provided, or is set to zero, a solo navmesh will be created.
   *
   * To use obstacles, a tiled navmesh must be generated.
   * @default 0
   */
  tileSize: number;

  /**
   * The xz-plane cell size to use for fields.
   * [Limit: > 0] [Units: wu]
   * @default 0.2
   */
  cs: number;

  /**
   * The y-axis cell size to use for fields.
   * Limit: > 0] [Units: wu]
   * @default 0.2
   */
  ch: number;

  /**
   * The maximum slope that is considered walkable.
   * [Limits: 0 <= value < 90] [Units: Degrees]
   * @default 60
   */
  walkableSlopeAngle: number;

  /**
   * Minimum floor to 'ceiling' height that will still allow the floor area to be considered walkable.
   * [Limit: >= 3] [Units: vx]
   * @default 2
   */
  walkableHeight: number;

  /**
   * Maximum ledge height that is considered to still be traversable.
   * [Limit: >=0] [Units: vx]
   * @default 2
   */
  walkableClimb: number;

  /**
   * The distance to erode/shrink the walkable area of the heightfield away from obstructions.
   * [Limit: >=0] [Units: vx]
   * @default 0.5
   */
  walkableRadius: number;

  /**
   * The maximum allowed length for contour edges along the border of the mesh.
   * [Limit: >=0] [Units: vx]
   * @default 12
   */
  maxEdgeLen: number;

  /**
   * The maximum distance a simplfied contour's border edges should deviate the original raw contour.
   * [Limit: >=0] [Units: vx]
   * @default 1.3
   */
  maxSimplificationError: number;

  /**
   * The minimum number of cells allowed to form isolated island areas.
   * [Limit: >=0] [Units: vx]
   * @default 8
   */
  minRegionArea: number;

  /**
   * Any regions with a span count smaller than this value will, if possible, be merged with larger regions.
   * [Limit: >=0] [Units: vx]
   * @default 20
   */
  mergeRegionArea: number;

  /**
   * The maximum number of vertices allowed for polygons generated during the be merged with larger regions.
   * [Limit: >=0] [Units: vx]
   * @default 6
   */
  maxVertsPerPoly: number;

  /**
   * Sets the sampling distance to use when generating the detail mesh. (For height detail only.)
   * [Limits: 0 or >= 0.9] [Units: wu]
   * @default 6
   */
  detailSampleDist: number;

  /**
   * The maximum distance the detail mesh surface should deviate from heightfield data. (For height detail only.)
   * [Limit: >=0] [Units: wu]
   * @default 1
   */
  detailSampleMaxError: number;

  /**
   * How many layers (or "floors") each navmesh tile is expected to have.
   */
  expectedLayersPerTile: number;

  /**
   * The max number of layers a navmesh can have.
   */
  maxLayers: number;
};

export type SoloNavMeshConfig = Omit<NavMeshConfig, 'tileSize'>;

export type TiledNavMeshConfig = NavMeshConfig;

const navMeshConfigDefaults: NavMeshConfig = {
  borderSize: 0,
  tileSize: 0,
  cs: 0.2,
  ch: 0.2,
  walkableSlopeAngle: 60,
  walkableHeight: 2,
  walkableClimb: 2,
  walkableRadius: 0.5,
  maxEdgeLen: 12,
  maxSimplificationError: 1.3,
  minRegionArea: 8,
  mergeRegionArea: 20,
  maxVertsPerPoly: 6,
  detailSampleDist: 6,
  detailSampleMaxError: 1,
  expectedLayersPerTile: 4,
  maxLayers: 32,
};

const tiledNavMeshConfigDefaults: Partial<NavMeshConfig> = {
  tileSize: 32,
};

export class NavMeshIntermediates {
  raw: R.NavMeshIntermediates;

  constructor(raw: R.NavMeshIntermediates) {
    this.raw = raw;
    finalizer.register(this);
  }

  heightfield(): rcHeightfield {
    return new rcHeightfield(this.raw.heightfield);
  }

  compactHeightfield(): rcCompactHeightfield {
    return new rcCompactHeightfield(this.raw.compactHeightfield);
  }

  contourSet(): rcContourSet {
    return new rcContourSet(this.raw.contourSet);
  }

  heightfieldLayerSet(): rcHeightfieldLayerSet {
    return new rcHeightfieldLayerSet(this.raw.heightfieldLayerSet);
  }

  destroy(): void {
    finalizer.unregister(this);
    emscripten.destroy(this.raw);
  }
}

export class TiledNavMeshIntermediates {
  raw: R.TiledNavMeshIntermediates;

  constructor(raw: R.TiledNavMeshIntermediates) {
    this.raw = raw;
    finalizer.register(this);
  }

  chunkyTriMesh(): rcChunkyTriMesh {
    return new rcChunkyTriMesh(this.raw.chunkyTriMesh);
  }

  intermediates(index: number): NavMeshIntermediates {
    return new NavMeshIntermediates(this.raw.get_intermediates(index));
  }

  intermediatesCount(): number {
    return this.raw.intermediatesCount;
  }

  destroy(): void {
    finalizer.unregister(this);

    for (let i = 0; i < this.intermediatesCount(); i++) {
      this.intermediates(i).destroy();
    }

    emscripten.destroy(this.raw);
  }
}

export type SoloNavMeshGeneratorResult = {
  success: boolean;
  navMesh: NavMesh;
  intermediates?: NavMeshIntermediates;
};

export type TiledNavMeshGeneratorResult = {
  success: boolean;
  navMesh: NavMesh;
  tileCache: TileCache;
  intermediates?: TiledNavMeshIntermediates;
};

export class NavMeshGenerator {
  raw: R.NavMeshGenerator;

  constructor() {
    this.raw = new Wasm.Recast.NavMeshGenerator();

    finalizer.register(this);
  }

  /**
   * Builds a Solo NavMesh from the given positions and indices.
   * @param positions a flat array of positions
   * @param indices a flat array of indices
   * @param navMeshConfig optional configuration for the NavMesh
   * @param keepIntermediates if true, the NavMeshIntermediates will be returned
   */
  generateSoloNavMesh(
    positions: ArrayLike<number>,
    indices: ArrayLike<number>,
    navMeshConfig: Partial<Omit<NavMeshConfig, 'tileSize'>> = {},
    keepIntermediates = false
  ): SoloNavMeshGeneratorResult {
    const config = { ...navMeshConfigDefaults, ...navMeshConfig, tileSize: 0 };

    const result = this.generate(positions, indices, config, keepIntermediates);

    const success = result.success;
    const navMesh = new NavMesh(result.navMesh);
    const intermediates = keepIntermediates
      ? new NavMeshIntermediates(result.soloNavMeshIntermediates)
      : undefined;

    return { success, navMesh, intermediates };
  }

  /**
   * Builds a Tiled NavMesh from the given positions and indices.
   * @param positions a flat array of positions
   * @param indices a flat array of indices
   * @param navMeshConfig optional configuration for the NavMesh
   * @param keepIntermediates if true, the TiledNavMeshIntermediates will be returned
   */
  generateTiledNavMesh(
    positions: ArrayLike<number>,
    indices: ArrayLike<number>,
    navMeshConfig: Partial<NavMeshConfig> = {},
    keepIntermediates = false
  ): TiledNavMeshGeneratorResult {
    const config = {
      ...navMeshConfigDefaults,
      ...tiledNavMeshConfigDefaults,
      ...navMeshConfig,
    };

    const result = this.generate(positions, indices, config, keepIntermediates);

    const success = result.success;
    const navMesh = new NavMesh(result.navMesh);
    const tileCache = new TileCache(result.tileCache);
    const intermediates = keepIntermediates
      ? new TiledNavMeshIntermediates(result.tiledNavMeshIntermediates)
      : undefined;

    return { success, navMesh, tileCache, intermediates };
  }

  private generate(
    positions: ArrayLike<number>,
    indices: ArrayLike<number>,
    config: NavMeshConfig,
    keepIntermediates: boolean
  ) {
    const rcConfig = new Wasm.Recast.rcConfig();
    rcConfig.borderSize = config.borderSize;
    rcConfig.tileSize = config.tileSize;
    rcConfig.cs = config.cs;
    rcConfig.ch = config.ch;
    rcConfig.walkableSlopeAngle = config.walkableSlopeAngle;
    rcConfig.walkableHeight = config.walkableHeight;
    rcConfig.walkableClimb = config.walkableClimb;
    rcConfig.walkableRadius = config.walkableRadius;
    rcConfig.maxEdgeLen = config.maxEdgeLen;
    rcConfig.maxSimplificationError = config.maxSimplificationError;
    rcConfig.minRegionArea = config.minRegionArea;
    rcConfig.mergeRegionArea = config.mergeRegionArea;
    rcConfig.maxVertsPerPoly = config.maxVertsPerPoly;
    rcConfig.detailSampleDist = config.detailSampleDist;
    rcConfig.detailSampleMaxError = config.detailSampleMaxError;

    return this.raw.generate(
      positions as number[],
      positions.length / 3,
      indices as number[],
      indices.length,
      rcConfig,
      config.expectedLayersPerTile,
      config.maxLayers,
      keepIntermediates
    );
  }

  destroy(): void {
    finalizer.unregister(this);
    emscripten.destroy(this.raw);
  }
}
