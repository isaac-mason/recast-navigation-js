import { NavMesh, NavMeshParams } from '../nav-mesh';
import { Raw } from '../raw';
import type R from '../raw-module';
import {
  RecastCompactHeightfield,
  RecastConfig,
  RecastConfigType,
  RecastHeightfield,
  RecastHeightfieldLayerSet,
  recastConfigDefaults,
} from '../recast';
import { TileCache, TileCacheMeshProcess } from '../tile-cache';
import { vec3 } from '../utils';
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
  chunkyTriMesh?: R.rcChunkyTriMesh;
  tileIntermediates: {
    tx: number;
    ty: number;
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
  let intermediates: TileCacheGeneratorIntermediates = {
    type: 'tilecache',
    chunkyTriMesh: undefined,
    tileIntermediates: [],
  };

  const fail = (error: string): TileCacheGeneratorFailResult => {
    if (!keepIntermediates) {
      for (let i = 0; i < intermediates.tileIntermediates.length; i++) {
        const tileIntermediate = intermediates.tileIntermediates[i];

        if (tileIntermediate.heightfieldLayerSet) {
          Raw.Recast.freeHeightfieldLayerSet(
            tileIntermediate.heightfieldLayerSet.raw
          );
        }

        if (tileIntermediate.compactHeightfield) {
          Raw.Recast.freeCompactHeightfield(
            tileIntermediate.compactHeightfield.raw
          );
        }

        if (tileIntermediate.heightfield) {
          Raw.Recast.freeHeightfield(tileIntermediate.heightfield.raw);
        }
      }
    }

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

  const tris = indices as number[];
  const nTris = indices.length / 3;

  const { bbMin, bbMax } = getBoundingBox(positions, indices);

  const vertsArray = new Raw.Arrays.FloatArray();
  vertsArray.copy(verts, verts.length);

  const trisArray = new Raw.Arrays.IntArray();
  trisArray.copy(tris, tris.length);

  const { expectedLayersPerTile, maxObstacles, ...recastConfig } = {
    ...tileCacheGeneratorConfigDefaults,
    ...navMeshGeneratorConfig,
  };

  const tileCache = new TileCache();
  const navMesh = new NavMesh();

  //
  // Step 1. Initialize build config.
  //
  const { raw: config } = RecastConfig.create(recastConfig);

  const gridSize = Raw.Recast.calcGridSize(bbMin, bbMax, config.cs);
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
  const tileCacheParams = new Raw.dtTileCacheParams();
  tileCacheParams.set_orig(0, bbMin[0]);
  tileCacheParams.set_orig(1, bbMin[1]);
  tileCacheParams.set_orig(2, bbMin[2]);
  tileCacheParams.cs = config.cs;
  tileCacheParams.ch = config.ch;
  tileCacheParams.width = config.tileSize;
  tileCacheParams.height = config.tileSize;
  tileCacheParams.walkableHeight = config.walkableHeight;
  tileCacheParams.walkableRadius = config.walkableRadius;
  tileCacheParams.walkableClimb = config.walkableClimb;
  tileCacheParams.maxSimplificationError = config.maxSimplificationError;
  tileCacheParams.maxTiles = tileWidth * tileHeight * expectedLayersPerTile;
  tileCacheParams.maxObstacles = maxObstacles;

  const allocator = new Raw.RecastLinearAllocator(32000);
  const compressor = new Raw.RecastFastLZCompressor();

  const meshProcess = new TileCacheMeshProcess(
    (navMeshCreateParams, polyAreas, polyFlags) => {
      for (let i = 0; i < navMeshCreateParams.polyCount; ++i) {
        polyAreas.set_data(i, 0);
        polyFlags.set_data(i, 1);
      }

      Raw.DetourNavMeshBuilder.setOffMeshConCount(navMeshCreateParams, 0);
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
  let polyBits = 22 - tileBits;

  const maxTiles = 1 << tileBits;
  const maxPolys = 1 << polyBits;

  const navMeshParams = NavMeshParams.create({
    orig,
    tileWidth: config.tileSize * config.cs,
    tileHeight: config.tileSize * config.cs,
    maxTiles,
    maxPolys,
  });

  if (!navMesh.initTiled(navMeshParams)) {
    return fail('Failed to initialize tiled navmesh');
  }

  const chunkyTriMesh = new Raw.rcChunkyTriMesh();
  intermediates.chunkyTriMesh = chunkyTriMesh;

  if (
    !Raw.ChunkyTriMesh.createChunkyTriMesh(
      vertsArray,
      trisArray,
      nTris,
      256,
      chunkyTriMesh
    )
  ) {
    return fail('Failed to build chunky triangle mesh');
  }

  const rasterizeTileLayers = (tx: number, ty: number) => {
    const rcContext = new Raw.rcContext();

    // Tile bounds
    const tcs = config.tileSize * config.cs;

    const { raw: tileConfig } = new RecastConfig(config).clone();

    const tileBoundsMin = [bbMin[0] + tx * tcs, bbMin[1], bbMin[2] + ty * tcs];

    const tileBoundsMax = [
      bbMin[0] + (tx + 1) * tcs,
      bbMax[1],
      bbMin[2] + (ty + 1) * tcs,
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
    const heightfield = Raw.Recast.allocHeightfield();

    if (
      !Raw.Recast.createHeightfield(
        rcContext,
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

    const tbmin = [tileBoundsMin[0], tileBoundsMin[2]];
    const tbmax = [tileBoundsMax[0], tileBoundsMax[2]];

    // TODO: Make grow when returning too many items.
    const maxChunkIds = 512;
    const chunkIdsArray = new Raw.Arrays.IntArray();
    chunkIdsArray.resize(maxChunkIds);

    const nChunksOverlapping = Raw.ChunkyTriMesh.getChunksOverlappingRect(
      chunkyTriMesh,
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
      const node = chunkyTriMesh.get_nodes(nodeId);
      const nNodeTris = node.n;

      const nodeTrisArray = Raw.ChunkyTriMesh.getChunkyTriMeshNodeTris(
        chunkyTriMesh,
        nodeId
      );

      const triAreasArray = new Raw.Arrays.UnsignedCharArray();
      triAreasArray.resize(nNodeTris);

      // Find triangles which are walkable based on their slope and rasterize them.
      // If your input data is multiple meshes, you can transform them here, calculate
      // the are type for each of the meshes and rasterize them.
      Raw.Recast.markWalkableTriangles(
        rcContext,
        tileConfig.walkableSlopeAngle,
        vertsArray,
        nVerts,
        nodeTrisArray,
        nNodeTris,
        triAreasArray
      );

      const success = Raw.Recast.rasterizeTriangles(
        rcContext,
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
    Raw.Recast.filterLowHangingWalkableObstacles(
      rcContext,
      config.walkableClimb,
      heightfield
    );
    Raw.Recast.filterLedgeSpans(
      rcContext,
      config.walkableHeight,
      config.walkableClimb,
      heightfield
    );
    Raw.Recast.filterWalkableLowHeightSpans(
      rcContext,
      config.walkableHeight,
      heightfield
    );

    const compactHeightfield = Raw.Recast.allocCompactHeightfield();
    if (
      !Raw.Recast.buildCompactHeightfield(
        rcContext,
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
      !Raw.Recast.erodeWalkableArea(
        rcContext,
        config.walkableRadius,
        compactHeightfield
      )
    ) {
      return { n: 0 };
    }

    const heightfieldLayerSet = Raw.Recast.allocHeightfieldLayerSet();
    if (
      !Raw.Recast.buildHeightfieldLayers(
        rcContext,
        compactHeightfield,
        config.borderSize,
        config.walkableHeight,
        heightfieldLayerSet
      )
    ) {
      return { n: 0 };
    }

    const tiles: R.UnsignedCharArray[] = [];

    for (let i = 0; i < heightfieldLayerSet.nlayers; i++) {
      const tile = new Raw.Arrays.UnsignedCharArray();
      const heightfieldLayer = heightfieldLayerSet.get_layers(i);

      // Store header
      const header = new Raw.dtTileCacheLayerHeader();
      header.magic = Raw.Detour.TILECACHE_MAGIC;
      header.version = Raw.Detour.TILECACHE_VERSION;

      // Tile layer location in the navmesh
      header.tx = tx;
      header.ty = ty;
      header.tlayer = i;

      header.set_bmin(0, heightfieldLayer.get_bmin(0));
      header.set_bmin(1, heightfieldLayer.get_bmin(1));
      header.set_bmin(2, heightfieldLayer.get_bmin(2));

      header.set_bmax(0, heightfieldLayer.get_bmax(0));
      header.set_bmax(1, heightfieldLayer.get_bmax(1));
      header.set_bmax(2, heightfieldLayer.get_bmax(2));

      // Tile info
      header.width = heightfieldLayer.width;
      header.height = heightfieldLayer.height;
      header.minx = heightfieldLayer.minx;
      header.maxx = heightfieldLayer.maxx;
      header.miny = heightfieldLayer.miny;
      header.maxy = heightfieldLayer.maxy;
      header.hmin = heightfieldLayer.hmin;
      header.hmax = heightfieldLayer.hmax;

      const heights = Raw.Recast.getHeightfieldLayerHeights(heightfieldLayer);
      const areas = Raw.Recast.getHeightfieldLayerAreas(heightfieldLayer);
      const cons = Raw.Recast.getHeightfieldLayerCons(heightfieldLayer);

      const status = Raw.DetourTileCacheBuilder.buildTileCacheLayer(
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
      tx,
      ty,
      heightfield: new RecastHeightfield(heightfield),
      compactHeightfield: new RecastCompactHeightfield(compactHeightfield),
      heightfieldLayerSet: new RecastHeightfieldLayerSet(heightfieldLayerSet),
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
            console.error('Failed to add tile to tile cache');
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

      Raw.Recast.freeHeightfieldLayerSet(
        tileIntermediate.heightfieldLayerSet.raw
      );
      Raw.Recast.freeCompactHeightfield(
        tileIntermediate.compactHeightfield.raw
      );
      Raw.Recast.freeHeightfield(tileIntermediate.heightfield.raw);
    }
  }

  return {
    success: true,
    tileCache,
    navMesh,
    intermediates: keepIntermediates ? intermediates : undefined,
  };
};
