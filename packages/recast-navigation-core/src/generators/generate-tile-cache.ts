import { NavMesh, NavMeshParams } from '../nav-mesh';
import { Arrays, Raw } from '../raw';
import type R from '../raw-module';
import {
  RecastBuildContext,
  RecastChunkyTriMesh,
  RecastCompactHeightfield,
  RecastConfig,
  RecastConfigType,
  RecastHeightfield,
  RecastHeightfieldLayerSet,
  allocCompactHeightfield,
  allocHeightfield,
  allocHeightfieldLayerSet,
  buildCompactHeightfield,
  buildHeightfieldLayers,
  calcGridSize,
  createHeightfield,
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
} from '../recast';
import {
  DetourTileCacheParams,
  TileCache,
  TileCacheMeshProcess,
  buildTileCacheLayer,
} from '../tile-cache';
import { Vector2Tuple, Vector3Tuple, vec3 } from '../utils';
import { dtIlog2, dtNextPow2, getBoundingBox } from './common';

export type TileCacheGeneratorConfig = RecastConfigType & {
  /**
   * How many layers (or "floors") each navmesh tile is expected to have.
   */
  expectedLayersPerTile: number;

  /**
   * The max number of obstacles
   */
  maxObstacles: number;
};

export const tileCacheGeneratorConfigDefaults: TileCacheGeneratorConfig = {
  ...recastConfigDefaults,
  tileSize: 32,
  expectedLayersPerTile: 4,
  maxObstacles: 128,
};

export type TileCacheGeneratorIntermediates = {
  type: 'tilecache';
  buildContext: RecastBuildContext;
  chunkyTriMesh?: RecastChunkyTriMesh;
  tileIntermediates: {
    tileX: number;
    tileY: number;
    heightfield: RecastHeightfield;
    heightfieldLayerSet: RecastHeightfieldLayerSet;
    compactHeightfield: RecastCompactHeightfield;
  }[];
};

type TileCacheGeneratorSuccessResult = {
  tileCache: TileCache;
  navMesh: NavMesh;
  success: true;
  intermediates?: TileCacheGeneratorIntermediates;
};

type TileCacheGeneratorFailResult = {
  tileCache: undefined;
  navMesh: undefined;
  success: false;
  error: string;
  intermediates?: TileCacheGeneratorIntermediates;
};

export type TileCacheGeneratorResult =
  | TileCacheGeneratorSuccessResult
  | TileCacheGeneratorFailResult;

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
  const buildContext = new RecastBuildContext();

  let intermediates: TileCacheGeneratorIntermediates = {
    type: 'tilecache',
    buildContext,
    chunkyTriMesh: undefined,
    tileIntermediates: [],
  };

  const tileCache = new TileCache();
  const navMesh = new NavMesh();

  const fail = (error: string): TileCacheGeneratorFailResult => {
    if (!keepIntermediates) {
      for (let i = 0; i < intermediates.tileIntermediates.length; i++) {
        const tileIntermediate = intermediates.tileIntermediates[i];

        if (tileIntermediate.heightfieldLayerSet) {
          freeHeightfieldLayerSet(tileIntermediate.heightfieldLayerSet);
        }

        if (tileIntermediate.compactHeightfield) {
          freeCompactHeightfield(tileIntermediate.compactHeightfield);
        }

        if (tileIntermediate.heightfield) {
          freeHeightfield(tileIntermediate.heightfield);
        }
      }
    }

    tileCache.destroy();
    navMesh.destroy();

    return {
      success: false,
      navMesh: undefined,
      tileCache: undefined,
      intermediates: keepIntermediates ? intermediates : undefined,
      error,
    };
  };

  const verts = positions as number[];
  const nVerts = indices.length;
  const vertsArray = new Arrays.FloatArray();
  vertsArray.copy(verts, verts.length);

  const tris = indices as number[];
  const nTris = indices.length / 3;
  const trisArray = new Arrays.IntArray();
  trisArray.copy(tris, tris.length);

  const { bbMin, bbMax } = getBoundingBox(positions, indices);

  const { expectedLayersPerTile, maxObstacles, ...recastConfig } = {
    ...tileCacheGeneratorConfigDefaults,
    ...navMeshGeneratorConfig,
  };

  //
  // Step 1. Initialize build config.
  //
  const { raw: config } = RecastConfig.create(recastConfig);

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
    walkableHeight: config.walkableHeight,
    walkableRadius: config.walkableRadius,
    walkableClimb: config.walkableClimb,
    maxSimplificationError: config.maxSimplificationError,
    maxTiles: tileWidth * tileHeight * expectedLayersPerTile,
    maxObstacles,
  });

  const allocator = new Raw.RecastLinearAllocator(32000);
  const compressor = new Raw.RecastFastLZCompressor();

  const meshProcess = new TileCacheMeshProcess(
    (navMeshCreateParams, polyAreas, polyFlags) => {
      for (let i = 0; i < navMeshCreateParams.polyCount(); ++i) {
        polyAreas.set(i, 0);
        polyFlags.set(i, 1);
      }

      navMeshCreateParams.setOffMeshConCount(0);
    }
  );

  if (!tileCache.init(tileCacheParams, allocator, compressor, meshProcess)) {
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

  if (!chunkyTriMesh.init(vertsArray, trisArray, nTris, 256)) {
    return fail('Failed to build chunky triangle mesh');
  }

  const rasterizeTileLayers = (tileX: number, tileY: number) => {
    // Tile bounds
    const tcs = config.tileSize * config.cs;

    const { raw: tileConfig } = new RecastConfig(config).clone();

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
    const chunkIdsArray = new Arrays.IntArray();
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
      const nodeId = chunkIdsArray.get_data(i);
      const node = chunkyTriMesh.nodes(nodeId);
      const nNodeTris = node.n;

      const nodeTrisArray = chunkyTriMesh.getNodeTris(nodeId);

      const triAreasArray = new Arrays.UnsignedCharArray();
      triAreasArray.resize(nNodeTris);

      // Find triangles which are walkable based on their slope and rasterize them.
      // If your input data is multiple meshes, you can transform them here, calculate
      // the are type for each of the meshes and rasterize them.
      markWalkableTriangles(
        buildContext,
        tileConfig.walkableSlopeAngle,
        vertsArray,
        nVerts,
        nodeTrisArray,
        nNodeTris,
        triAreasArray
      );

      const success = rasterizeTriangles(
        buildContext,
        vertsArray,
        nVerts,
        nodeTrisArray,
        triAreasArray,
        nNodeTris,
        heightfield,
        tileConfig.walkableClimb
      );

      triAreasArray.free();

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

    const tiles: R.UnsignedCharArray[] = [];

    for (let i = 0; i < heightfieldLayerSet.nlayers(); i++) {
      const tile = new Arrays.UnsignedCharArray();
      const heightfieldLayer = heightfieldLayerSet.layers(i);

      // Store header
      const header = new Raw.dtTileCacheLayerHeader();
      header.magic = Raw.Detour.TILECACHE_MAGIC;
      header.version = Raw.Detour.TILECACHE_VERSION;

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

      if (Raw.Detour.statusFailed(status)) {
        return { n: 0 };
      }

      tiles.push(tile);
    }

    intermediates.tileIntermediates.push({
      tileX,
      tileY,
      heightfield,
      compactHeightfield,
      heightfieldLayerSet,
    });

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

          if (Raw.Detour.statusFailed(addResult.status)) {
            buildContext.log(
              Raw.Module.RC_LOG_WARNING,
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

      if (Raw.Detour.statusFailed(dtStatus)) {
        return fail(`Failed to build nav mesh tiles at ${x}, ${y}`);
      }
    }
  }

  // Free intermediates
  if (!keepIntermediates) {
    for (let i = 0; i < intermediates.tileIntermediates.length; i++) {
      const tileIntermediate = intermediates.tileIntermediates[i];

      freeHeightfieldLayerSet(tileIntermediate.heightfieldLayerSet);
      freeCompactHeightfield(tileIntermediate.compactHeightfield);
      freeHeightfield(tileIntermediate.heightfield);
    }
  }

  return {
    success: true,
    tileCache,
    navMesh,
    intermediates: keepIntermediates ? intermediates : undefined,
  };
};
