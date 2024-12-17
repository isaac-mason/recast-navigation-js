import {
  ChunkIdsArray,
  Detour,
  DetourTileCacheParams,
  NavMesh,
  NavMeshParams,
  Raw,
  Recast,
  RecastBuildContext,
  RecastChunkyTriMesh,
  RecastCompactHeightfield,
  RecastConfig,
  RecastHeightfield,
  RecastHeightfieldLayerSet,
  TileCache,
  TileCacheData,
  TileCacheMeshProcess,
  TriangleAreasArray,
  TrianglesArray,
  UnsignedCharArray,
  Vector2Tuple,
  Vector3Tuple,
  VerticesArray,
  allocCompactHeightfield,
  allocHeightfield,
  allocHeightfieldLayerSet,
  buildCompactHeightfield,
  buildHeightfieldLayers,
  buildTileCacheLayer,
  calcGridSize,
  cloneRcConfig,
  createHeightfield,
  createRcConfig,
  erodeWalkableArea,
  filterLedgeSpans,
  filterLowHangingWalkableObstacles,
  filterWalkableLowHeightSpans,
  freeCompactHeightfield,
  freeHeightfield,
  freeHeightfieldLayerSet,
  getHeightfieldLayerAreas,
  getHeightfieldLayerCons,
  getHeightfieldLayerHeights,
  markWalkableTriangles,
  rasterizeTriangles,
  recastConfigDefaults,
  statusFailed,
  vec3,
} from '@recast-navigation/core';
import { Pretty } from '../types';
import { dtIlog2, dtNextPow2, getBoundingBox } from './common';

type TileCacheRecastConfig = Omit<RecastConfig, 'minRegionArea' | 'maxEdgeLen'>;

export type TileCacheGeneratorConfig = Pretty<
  TileCacheRecastConfig & {
    /**
     * The minimum and maximum bounds of the heightfield's AABB in world units.
     * If not provided, the bounding box will be calculated from the input positions and indices
     */
    bounds?: [bbMin: Vector3Tuple, bbMax: Vector3Tuple];

    /**
     * How many layers (or "floors") each navmesh tile is expected to have.
     */
    expectedLayersPerTile: number;

    /**
     * The max number of obstacles
     */
    maxObstacles: number;

    /**
     * The tile cache mesh process implementation.
     * If not provided, a default one is created via `createDefaultTileCacheMeshProcess()`
     * @default createDefaultTileCacheMeshProcess()
     */
    tileCacheMeshProcess?: TileCacheMeshProcess;
  }
>;

export const tileCacheGeneratorConfigDefaults: TileCacheGeneratorConfig = {
  ...recastConfigDefaults,
  tileSize: 32,
  expectedLayersPerTile: 4,
  maxObstacles: 128,
};

export type TileCacheGeneratorTileIntermediates = {
  tileX: number;
  tileY: number;
  heightfield?: RecastHeightfield;
  compactHeightfield?: RecastCompactHeightfield;
  heightfieldLayerSet?: RecastHeightfieldLayerSet;
};

export type TileCacheGeneratorIntermediates = {
  type: 'tilecache';
  buildContext: RecastBuildContext;
  chunkyTriMesh?: RecastChunkyTriMesh;
  tileIntermediates: TileCacheGeneratorTileIntermediates[];
};

type TileCacheGeneratorSuccessResult = {
  tileCache: TileCache;
  navMesh: NavMesh;
  success: true;
  intermediates: TileCacheGeneratorIntermediates;
};

type TileCacheGeneratorFailResult = {
  tileCache: undefined;
  navMesh: undefined;
  success: false;
  error: string;
  intermediates: TileCacheGeneratorIntermediates;
};

export type TileCacheGeneratorResult =
  | TileCacheGeneratorSuccessResult
  | TileCacheGeneratorFailResult;

export const createDefaultTileCacheMeshProcess = () =>
  new TileCacheMeshProcess((navMeshCreateParams, polyAreas, polyFlags) => {
    for (let i = 0; i < navMeshCreateParams.polyCount(); ++i) {
      polyAreas.set(i, 0);
      polyFlags.set(i, 1);
    }
  });

/**
 * Builds a TileCache and NavMesh from the given positions and indices.
 * TileCache assumes small tiles (around 32-64 squared) and does some tricks to make the update fast.
 * @param positions a flat array of positions
 * @param indices a flat array of indices
 * @param navMeshConfig optional configuration for the NavMesh
 * @param keepIntermediates if true intermediates will be returned
 */
export const generateTileCache = (
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  navMeshGeneratorConfig: Partial<TileCacheGeneratorConfig> = {},
  keepIntermediates = false
): TileCacheGeneratorResult => {
  if (!Raw.Module) {
    throw new Error(
      '"init" must be called before using any recast-navigation-js APIs. See: https://github.com/isaac-mason/recast-navigation-js?tab=readme-ov-file#initialization'
    );
  }

  const buildContext = new RecastBuildContext();

  const intermediates: TileCacheGeneratorIntermediates = {
    type: 'tilecache',
    buildContext,
    chunkyTriMesh: undefined,
    tileIntermediates: [],
  };

  const tileCache = new TileCache();
  const navMesh = new NavMesh();

  /* input geometry */
  const vertices = positions as number[];
  const numVertices = indices.length;
  const verticesArray = new VerticesArray();
  verticesArray.copy(vertices);

  const triangles = indices as number[];
  const numTriangles = indices.length / 3;
  const trianglesArray = new TrianglesArray();
  trianglesArray.copy(triangles);

  let bbMin: Vector3Tuple;
  let bbMax: Vector3Tuple;

  if (navMeshGeneratorConfig.bounds) {
    bbMin = navMeshGeneratorConfig.bounds[0];
    bbMax = navMeshGeneratorConfig.bounds[1];
  } else {
    const boundingBox = getBoundingBox(positions, indices);
    bbMin = boundingBox.bbMin;
    bbMax = boundingBox.bbMax;
  }

  const { expectedLayersPerTile, maxObstacles, ...recastConfig } = {
    ...tileCacheGeneratorConfigDefaults,
    ...navMeshGeneratorConfig,
  };

  const cleanup = () => {
    verticesArray.destroy();
    trianglesArray.destroy();

    if (!keepIntermediates) {
      for (let i = 0; i < intermediates.tileIntermediates.length; i++) {
        const tileIntermediate = intermediates.tileIntermediates[i];

        if (tileIntermediate.heightfield) {
          freeHeightfield(tileIntermediate.heightfield);
          tileIntermediate.heightfield = undefined;
        }

        if (tileIntermediate.compactHeightfield) {
          freeCompactHeightfield(tileIntermediate.compactHeightfield);
          tileIntermediate.compactHeightfield = undefined;
        }

        if (tileIntermediate.heightfieldLayerSet) {
          freeHeightfieldLayerSet(tileIntermediate.heightfieldLayerSet);
          tileIntermediate.heightfieldLayerSet = undefined;
        }
      }
    }
  };

  const fail = (error: string): TileCacheGeneratorFailResult => {
    cleanup();

    tileCache.destroy();
    navMesh.destroy();

    return {
      success: false,
      navMesh: undefined,
      tileCache: undefined,
      intermediates,
      error,
    };
  };

  //
  // Step 1. Initialize build config.
  //
  const config = createRcConfig(recastConfig);

  const gridSize = calcGridSize(bbMin, bbMax, config.cs);
  config.width = gridSize.width;
  config.height = gridSize.height;

  config.minRegionArea = config.minRegionArea * config.minRegionArea; // Note: area = size*size
  config.mergeRegionArea = config.mergeRegionArea * config.mergeRegionArea; // Note: area = size*size
  config.detailSampleDist =
    config.detailSampleDist < 0.9 ? 0 : config.cs * config.detailSampleDist;
  config.detailSampleMaxError = config.ch * config.detailSampleMaxError;

  const tileSize = Math.floor(config.tileSize);
  const tileWidth = Math.floor((config.width + tileSize - 1) / tileSize);
  const tileHeight = Math.floor((config.height + tileSize - 1) / tileSize);

  // Generation params
  config.borderSize = config.walkableRadius + 3; // Reserve enough padding.
  config.width = config.tileSize + config.borderSize * 2;
  config.height = config.tileSize + config.borderSize * 2;

  // Tile cache params
  const tileCacheParams = DetourTileCacheParams.create({
    orig: bbMin,
    cs: config.cs,
    ch: config.ch,
    width: config.tileSize,
    height: config.tileSize,
    walkableHeight: config.walkableHeight * config.ch,
    walkableRadius: config.walkableRadius * config.cs,
    walkableClimb: config.walkableClimb * config.ch,
    maxSimplificationError: config.maxSimplificationError,
    maxTiles: tileWidth * tileHeight * expectedLayersPerTile,
    maxObstacles,
  });

  const allocator = new Raw.RecastLinearAllocator(32000);
  const compressor = new Raw.RecastFastLZCompressor();

  const tileCacheMeshProcess =
    navMeshGeneratorConfig.tileCacheMeshProcess ??
    createDefaultTileCacheMeshProcess();

  if (
    !tileCache.init(
      tileCacheParams,
      allocator,
      compressor,
      tileCacheMeshProcess
    )
  ) {
    return fail('Failed to initialize tile cache');
  }

  const orig = vec3.fromArray(bbMin);

  // Max tiles and max polys affect how the tile IDs are caculated.
  // There are 22 bits available for identifying a tile and a polygon.
  let tileBits = Math.min(
    Math.floor(
      dtIlog2(dtNextPow2(tileWidth * tileHeight * expectedLayersPerTile))
    ),
    14
  );
  if (tileBits > 14) {
    tileBits = 14;
  }
  const polyBits = 22 - tileBits;

  const maxTiles = 1 << tileBits;
  const maxPolysPerTile = 1 << polyBits;

  const navMeshParams = NavMeshParams.create({
    orig,
    tileWidth: config.tileSize * config.cs,
    tileHeight: config.tileSize * config.cs,
    maxTiles,
    maxPolys: maxPolysPerTile,
  });

  if (!navMesh.initTiled(navMeshParams)) {
    return fail('Failed to initialize tiled navmesh');
  }

  const chunkyTriMesh = new RecastChunkyTriMesh();
  intermediates.chunkyTriMesh = chunkyTriMesh;

  if (!chunkyTriMesh.init(verticesArray, trianglesArray, numTriangles, 256)) {
    return fail('Failed to build chunky triangle mesh');
  }

  const rasterizeTileLayers = (tileX: number, tileY: number) => {
    // Tile intermediates
    const tileIntermediates: TileCacheGeneratorTileIntermediates = {
      tileX,
      tileY,
    };

    // Tile bounds
    const tcs = config.tileSize * config.cs;

    const tileConfig = cloneRcConfig(config);

    const tileBoundsMin: Vector3Tuple = [
      bbMin[0] + tileX * tcs,
      bbMin[1],
      bbMin[2] + tileY * tcs,
    ];

    const tileBoundsMax: Vector3Tuple = [
      bbMin[0] + (tileX + 1) * tcs,
      bbMax[1],
      bbMin[2] + (tileY + 1) * tcs,
    ];

    tileBoundsMin[0] -= tileConfig.borderSize * tileConfig.cs;
    tileBoundsMin[2] -= tileConfig.borderSize * tileConfig.cs;
    tileBoundsMax[0] += tileConfig.borderSize * tileConfig.cs;
    tileBoundsMax[2] += tileConfig.borderSize * tileConfig.cs;

    tileConfig.set_bmin(0, tileBoundsMin[0]);
    tileConfig.set_bmin(1, tileBoundsMin[1]);
    tileConfig.set_bmin(2, tileBoundsMin[2]);

    tileConfig.set_bmax(0, tileBoundsMax[0]);
    tileConfig.set_bmax(1, tileBoundsMax[1]);
    tileConfig.set_bmax(2, tileBoundsMax[2]);

    // Allocate voxel heightfield where we rasterize our input data to.
    const heightfield = allocHeightfield();
    tileIntermediates.heightfield = heightfield;

    if (
      !createHeightfield(
        buildContext,
        heightfield,
        tileConfig.width,
        tileConfig.height,
        tileBoundsMin,
        tileBoundsMax,
        tileConfig.cs,
        tileConfig.ch
      )
    ) {
      return { n: 0 };
    }

    const tbmin: Vector2Tuple = [tileBoundsMin[0], tileBoundsMin[2]];
    const tbmax: Vector2Tuple = [tileBoundsMax[0], tileBoundsMax[2]];

    // TODO: Make grow when returning too many items.
    const maxChunkIds = 512;
    const chunkIdsArray = new ChunkIdsArray();
    chunkIdsArray.resize(maxChunkIds);

    const nChunksOverlapping = chunkyTriMesh.getChunksOverlappingRect(
      tbmin,
      tbmax,
      chunkIdsArray,
      maxChunkIds
    );

    if (nChunksOverlapping === 0) {
      return { n: 0 };
    }

    for (let i = 0; i < nChunksOverlapping; ++i) {
      const nodeId = chunkIdsArray.get(i);
      const node = chunkyTriMesh.nodes(nodeId);
      const nNodeTris = node.n;

      const nodeTrianglesArray = chunkyTriMesh.getNodeTris(nodeId);

      const triangleAreasArray = new TriangleAreasArray();
      triangleAreasArray.resize(nNodeTris);

      // Find triangles which are walkable based on their slope and rasterize them.
      // If your input data is multiple meshes, you can transform them here, calculate
      // the are type for each of the meshes and rasterize them.
      markWalkableTriangles(
        buildContext,
        tileConfig.walkableSlopeAngle,
        verticesArray,
        numVertices,
        nodeTrianglesArray,
        nNodeTris,
        triangleAreasArray
      );

      const success = rasterizeTriangles(
        buildContext,
        verticesArray,
        numVertices,
        nodeTrianglesArray,
        triangleAreasArray,
        nNodeTris,
        heightfield,
        tileConfig.walkableClimb
      );

      triangleAreasArray.destroy();

      if (!success) {
        return { n: 0 };
      }
    }

    // Once all geometry is rasterized, we do initial pass of filtering to
    // remove unwanted overhangs caused by the conservative rasterization
    // as well as filter spans where the character cannot possibly stand.
    filterLowHangingWalkableObstacles(
      buildContext,
      config.walkableClimb,
      heightfield
    );
    filterLedgeSpans(
      buildContext,
      config.walkableHeight,
      config.walkableClimb,
      heightfield
    );
    filterWalkableLowHeightSpans(
      buildContext,
      config.walkableHeight,
      heightfield
    );

    const compactHeightfield = allocCompactHeightfield();
    if (
      !buildCompactHeightfield(
        buildContext,
        config.walkableHeight,
        config.walkableClimb,
        heightfield,
        compactHeightfield
      )
    ) {
      return { n: 0 };
    }

    if (!keepIntermediates) {
      freeHeightfield(tileIntermediates.heightfield);
      tileIntermediates.heightfield = undefined;
    }

    // Erode the walkable area by agent radius
    if (
      !erodeWalkableArea(
        buildContext,
        config.walkableRadius,
        compactHeightfield
      )
    ) {
      return { n: 0 };
    }

    const heightfieldLayerSet = allocHeightfieldLayerSet();
    if (
      !buildHeightfieldLayers(
        buildContext,
        compactHeightfield,
        config.borderSize,
        config.walkableHeight,
        heightfieldLayerSet
      )
    ) {
      return { n: 0 };
    }

    if (!keepIntermediates) {
      freeCompactHeightfield(compactHeightfield);
      tileIntermediates.compactHeightfield = undefined;
    }

    const tiles: UnsignedCharArray[] = [];

    for (let i = 0; i < heightfieldLayerSet.nlayers(); i++) {
      const tile = new TileCacheData();
      const heightfieldLayer = heightfieldLayerSet.layers(i);

      // Store header
      const header = new Raw.dtTileCacheLayerHeader();
      header.magic = Detour.DT_TILECACHE_MAGIC;
      header.version = Detour.DT_TILECACHE_VERSION;

      // Tile layer location in the navmesh
      header.tx = tileX;
      header.ty = tileY;
      header.tlayer = i;

      const heightfieldLayerBin = heightfieldLayer.bmin();
      const heightfieldLayerBmax = heightfieldLayer.bmax();
      header.set_bmin(0, heightfieldLayerBin.x);
      header.set_bmin(1, heightfieldLayerBin.y);
      header.set_bmin(2, heightfieldLayerBin.z);

      header.set_bmax(0, heightfieldLayerBmax.x);
      header.set_bmax(1, heightfieldLayerBmax.y);
      header.set_bmax(2, heightfieldLayerBmax.z);

      // Tile info
      header.width = heightfieldLayer.width();
      header.height = heightfieldLayer.height();
      header.minx = heightfieldLayer.minx();
      header.maxx = heightfieldLayer.maxx();
      header.miny = heightfieldLayer.miny();
      header.maxy = heightfieldLayer.maxy();
      header.hmin = heightfieldLayer.hmin();
      header.hmax = heightfieldLayer.hmax();

      const heights = getHeightfieldLayerHeights(heightfieldLayer);
      const areas = getHeightfieldLayerAreas(heightfieldLayer);
      const cons = getHeightfieldLayerCons(heightfieldLayer);

      const status = buildTileCacheLayer(
        compressor,
        header,
        heights,
        areas,
        cons,
        tile
      );

      if (statusFailed(status)) {
        return { n: 0 };
      }

      tiles.push(tile);
    }

    if (!keepIntermediates) {
      freeHeightfieldLayerSet(heightfieldLayerSet);
      tileIntermediates.heightfieldLayerSet = undefined;
    }

    intermediates.tileIntermediates.push(tileIntermediates);

    return { n: tiles.length, tiles };
  };

  // Preprocess tiles
  for (let y = 0; y < tileHeight; ++y) {
    for (let x = 0; x < tileWidth; ++x) {
      const { n, tiles: newTiles } = rasterizeTileLayers(x, y);

      if (n > 0 && newTiles) {
        for (let i = 0; i < n; i++) {
          const tileCacheData = newTiles[i];

          const addResult = tileCache.addTile(tileCacheData);

          if (statusFailed(addResult.status)) {
            buildContext.log(
              Recast.RC_LOG_WARNING,
              `Failed to add tile to tile cache - tx: ${x}, ty: ${y}`
            );
            continue;
          }
        }
      }
    }
  }

  // Build initial meshes
  for (let y = 0; y < tileHeight; y++) {
    for (let x = 0; x < tileWidth; x++) {
      const dtStatus = tileCache.buildNavMeshTilesAt(x, y, navMesh);

      if (statusFailed(dtStatus)) {
        return fail(`Failed to build nav mesh tiles at ${x}, ${y}`);
      }
    }
  }

  cleanup();

  return {
    success: true,
    tileCache,
    navMesh,
    intermediates,
  };
};
