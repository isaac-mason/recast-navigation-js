import R from '@recast-navigation/wasm';
import { NavMesh, NavMeshParams } from '../nav-mesh';
import { Raw } from '../raw';
import {
  RecastCompactHeightfield,
  RecastConfig,
  RecastConfigType,
  RecastContourSet,
  RecastHeightfield,
  recastConfigDefaults,
} from '../recast';
import { Pretty } from '../types';
import { Vector3Tuple, vec3 } from '../utils';
import { dtIlog2, dtNextPow2, getBoundingBox } from './common';

export type TiledNavMeshGeneratorConfig = Pretty<RecastConfigType>;

export const tiledNavMeshGeneratorConfigDefaults: TiledNavMeshGeneratorConfig =
  {
    ...recastConfigDefaults,
  };

export type TiledNavMeshGeneratorIntermediates = {
  type: 'tiled';
  buildContext?: R.rcContext;
  chunkyTriMesh?: R.rcChunkyTriMesh;
  tileIntermediates: {
    tx: number;
    ty: number;
    heightfield?: RecastHeightfield;
    compactHeightfield?: RecastCompactHeightfield;
    contourSet?: RecastContourSet;
  }[];
};

type TiledNavMeshGeneratorSuccessResult = {
  navMesh: NavMesh;
  success: true;
  intermediates?: TiledNavMeshGeneratorIntermediates;
};

type TiledNavMeshGeneratorFailResult = {
  navMesh: undefined;
  success: false;
  intermediates?: TiledNavMeshGeneratorIntermediates;
  error: string;
};

export type TiledNavMeshGeneratorResult =
  | TiledNavMeshGeneratorSuccessResult
  | TiledNavMeshGeneratorFailResult;

/**
 * Builds a Tiled NavMesh
 * @param positions a flat array of positions
 * @param indices a flat array of indices
 * @param navMeshGeneratorConfig optional configuration for the NavMesh generator
 * @param keepIntermediates if true intermediates will be returned
 */
export const generateTiledNavMesh = (
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  navMeshGeneratorConfig: Partial<TiledNavMeshGeneratorConfig> = {},
  keepIntermediates = false
): TiledNavMeshGeneratorResult => {
  const buildContext = new Raw.rcContext();

  const intermediates: TiledNavMeshGeneratorIntermediates = {
    type: 'tiled',
    buildContext: buildContext,
    chunkyTriMesh: undefined,
    tileIntermediates: [],
  };

  const freeIntermediates = () => {
    for (let i = 0; i < intermediates.tileIntermediates.length; i++) {
      const tileIntermediate = intermediates.tileIntermediates[i];

      if (tileIntermediate.compactHeightfield) {
        Raw.Recast.freeCompactHeightfield(
          tileIntermediate.compactHeightfield.raw
        );
      }

      if (tileIntermediate.heightfield) {
        Raw.Recast.freeHeightfield(tileIntermediate.heightfield.raw);
      }

      if (tileIntermediate.contourSet) {
        Raw.Recast.freeContourSet(tileIntermediate.contourSet.raw);
      }
    }
  };

  const fail = (error: string): TiledNavMeshGeneratorFailResult => {
    if (!keepIntermediates) {
      freeIntermediates();
    }

    return {
      success: false,
      navMesh: undefined,
      intermediates: keepIntermediates ? intermediates : undefined,
      error,
    };
  };

  const navMesh = new NavMesh();

  //
  // Initialize build config.
  //
  const recastConfig = RecastConfig.create({
    ...tiledNavMeshGeneratorConfigDefaults,
    ...navMeshGeneratorConfig,
  });
  const { raw: config } = recastConfig;

  /* get input bounding box */
  const { bbMin, bbMax } = getBoundingBox(positions, indices);

  /* grid size */
  const gridSize = Raw.Recast.calcGridSize(bbMin, bbMax, config.cs);
  config.width = gridSize.width;
  config.height = gridSize.height;

  config.minRegionArea = config.minRegionArea * config.minRegionArea; // Note: area = size*size
  config.mergeRegionArea = config.mergeRegionArea * config.mergeRegionArea; // Note: area = size*size
  config.tileSize = Math.floor(config.tileSize);
  config.borderSize = config.walkableRadius + 3; // Reserve enough padding.
  config.width = config.tileSize + config.borderSize * 2;
  config.height = config.tileSize + config.borderSize * 2;
  config.detailSampleDist =
    config.detailSampleDist < 0.9 ? 0 : config.cs * config.detailSampleDist;
  config.detailSampleMaxError = config.ch * config.detailSampleMaxError;

  // tile size
  const tileSize = Math.floor(config.tileSize);
  const tileWidth = Math.floor((gridSize.width + tileSize - 1) / tileSize);
  const tileHeight = Math.floor((gridSize.height + tileSize - 1) / tileSize);
  const tcs = config.tileSize * config.cs;

  /* verts */
  const verts = positions as number[];
  const nVerts = indices.length;
  const vertsArray = new Raw.Arrays.FloatArray();
  vertsArray.copy(verts, verts.length);

  /* tris */
  const tris = indices as number[];
  const nTris = indices.length / 3;
  const trisArray = new Raw.Arrays.IntArray();
  trisArray.copy(tris, tris.length);

  /* Create dtNavMeshParams, initialise nav mesh for tiled use */
  const orig = vec3.fromArray(bbMin);

  // Max tiles and max polys affect how the tile IDs are caculated.
  // There are 22 bits available for identifying a tile and a polygon.
  let tileBits = Math.min(
    Math.floor(dtIlog2(dtNextPow2(tileWidth * tileHeight))),
    14
  );
  if (tileBits > 14) tileBits = 14;
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
    return fail('Could not init nav mesh for tiled use');
  }

  /* create chunky tri mesh */
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

  /** @internal */
  const buildTileMesh = (
    tx: number,
    ty: number,
    bmin: Vector3Tuple,
    bmax: Vector3Tuple
  ):
    | { success: true; data?: R.UnsignedCharArray }
    | { success: false; error: string } => {
    const failTileMesh = (error: string) => {
      buildContext.log(Raw.Module.RC_LOG_ERROR, error);

      return { success: false as const, error };
    };

    const tileIntermediate: {
      tx: number;
      ty: number;
      heightfield?: RecastHeightfield;
      compactHeightfield?: RecastCompactHeightfield;
      contourSet?: RecastContourSet;
    } = { tx, ty };

    intermediates.tileIntermediates.push(tileIntermediate);

    const { raw: tileConfig } = recastConfig.clone();

    // Expand the heighfield bounding box by border size to find the extents of geometry we need to build this tile.
    //
    // This is done in order to make sure that the navmesh tiles connect correctly at the borders,
    // and the obstacles close to the border work correctly with the dilation process.
    // No polygons (or contours) will be created on the border area.
    //
    // IMPORTANT!
    //
    //   :''''''''':
    //   : +-----+ :
    //   : |     | :
    //   : |     |<--- tile to build
    //   : |     | :
    //   : +-----+ :<-- geometry needed
    //   :.........:
    //
    // You should use this bounding box to query your input geometry.
    //
    // For example if you build a navmesh for terrain, and want the navmesh tiles to match the terrain tile size
    // you will need to pass in data from neighbour terrain tiles too! In a simple case, just pass in all the 8 neighbours,
    // or use the bounding box below to only pass in a sliver of each of the 8 neighbours.

    const tileBoundsMin = [...bmin];
    const tileBoundsMax = [...bmax];

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

    // Reset build timer
    buildContext.resetTimers();

    // Start the build process
    buildContext.startTimer(Raw.Module.RC_TIMER_TOTAL);

    buildContext.log(Raw.Module.RC_LOG_PROGRESS, 'Building navigation:');
    buildContext.log(
      Raw.Module.RC_LOG_PROGRESS,
      ` - ${config.width} x ${config.height} cells`
    );
    buildContext.log(
      Raw.Module.RC_LOG_PROGRESS,
      ` - ${nVerts / 1000}fK verts, ${nTris / 1000}K tris`
    );

    // Allocate voxel heightfield where we rasterize our input data to.
    const heightfield = Raw.Recast.allocHeightfield();
    if (!heightfield) {
      return fail('Could not allocate heightfield');
    }

    tileIntermediate.heightfield = new RecastHeightfield(heightfield);

    if (
      !Raw.Recast.createHeightfield(
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
      return failTileMesh('Could not create heightfield');
    }

    // Allocate array that can hold triangle flags.
    // If you have multiple meshes you need to process, allocate
    // and array which can hold the max number of triangles you need to process.
    const triAreas = new Raw.Arrays.UnsignedCharArray();
    triAreas.resize(chunkyTriMesh.maxTrisPerChunk);

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
      return { success: true };
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
        buildContext,
        tileConfig.walkableSlopeAngle,
        vertsArray,
        nVerts,
        nodeTrisArray,
        nNodeTris,
        triAreasArray
      );

      const success = Raw.Recast.rasterizeTriangles(
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
        return failTileMesh('Could not rasterize triangles');
      }
    }

    // Once all geometry is rasterized, we do initial pass of filtering to
    // remove unwanted overhangs caused by the conservative rasterization
    // as well as filter spans where the character cannot possibly stand.
    Raw.Recast.filterLowHangingWalkableObstacles(
      buildContext,
      tileConfig.walkableClimb,
      heightfield
    );
    Raw.Recast.filterLedgeSpans(
      buildContext,
      tileConfig.walkableHeight,
      tileConfig.walkableClimb,
      heightfield
    );
    Raw.Recast.filterWalkableLowHeightSpans(
      buildContext,
      tileConfig.walkableHeight,
      heightfield
    );

    // Compact the heightfield so that it is faster to handle from now on.
    // This will result more cache coherent data as well as the neighbours
    // between walkable cells will be calculated.
    const compactHeightfield = Raw.Recast.allocCompactHeightfield();

    if (Raw.isNull(compactHeightfield)) {
      return failTileMesh('Could not allocate compact heightfield');
    }

    tileIntermediate.compactHeightfield = new RecastCompactHeightfield(
      compactHeightfield
    );

    if (
      !Raw.Recast.buildCompactHeightfield(
        buildContext,
        tileConfig.walkableHeight,
        tileConfig.walkableClimb,
        heightfield,
        compactHeightfield
      )
    ) {
      return failTileMesh('Could not build compact heightfield');
    }

    // Erode the walkable area by agent radius
    if (
      !Raw.Recast.erodeWalkableArea(
        buildContext,
        tileConfig.walkableRadius,
        compactHeightfield
      )
    ) {
      return failTileMesh('Could not erode walkable area');
    }

    // (Optional) Mark areas
    // Raw.Recast.markConvexPolyArea(...)

    // Prepare for region partitioning, by calculating Distance field along the walkable surface.
    if (!Raw.Recast.buildDistanceField(buildContext, compactHeightfield)) {
      return failTileMesh('Failed to build distance field');
    }

    // Partition the walkable surface into simple regions without holes.
    if (
      !Raw.Recast.buildRegions(
        buildContext,
        compactHeightfield,
        tileConfig.borderSize,
        tileConfig.minRegionArea,
        tileConfig.mergeRegionArea
      )
    ) {
      return failTileMesh('Failed to build regions');
    }

    //
    // Trace and simplify region contours.
    //
    const contourSet = Raw.Recast.allocContourSet();
    if (Raw.isNull(contourSet)) {
      return failTileMesh('Failed to allocate contour set');
    }

    tileIntermediate.contourSet = new RecastContourSet(contourSet);

    if (
      !Raw.Recast.buildContours(
        buildContext,
        compactHeightfield,
        tileConfig.maxSimplificationError,
        tileConfig.maxEdgeLen,
        contourSet,
        Raw.Module.RC_CONTOUR_TESS_WALL_EDGES
      )
    ) {
      return failTileMesh('Failed to create contours');
    }

    //
    // Build polygons mesh from contours.
    //
    const polyMesh = Raw.Recast.allocPolyMesh();
    if (Raw.isNull(polyMesh)) {
      return failTileMesh('Failed to allocate poly mesh');
    }

    if (
      !Raw.Recast.buildPolyMesh(
        buildContext,
        contourSet,
        tileConfig.maxVertsPerPoly,
        polyMesh
      )
    ) {
      return failTileMesh('Failed to triangulate contours');
    }

    //
    // Create detail mesh which allows to access approximate height on each polygon.
    //
    const polyMeshDetail = Raw.Recast.allocPolyMeshDetail();
    if (Raw.isNull(polyMeshDetail)) {
      return failTileMesh('Failed to allocate poly mesh detail');
    }

    if (
      !Raw.Recast.buildPolyMeshDetail(
        buildContext,
        polyMesh,
        compactHeightfield,
        tileConfig.detailSampleDist,
        tileConfig.detailSampleMaxError,
        polyMeshDetail
      )
    ) {
      return failTileMesh('Failed to build detail mesh');
    }

    // Update poly flags from areas.
    for (let i = 0; i < polyMesh.npolys; i++) {
      if (polyMesh.get_areas(i) == Raw.Recast.WALKABLE_AREA) {
        polyMesh.set_areas(i, 0);
      }
      if (polyMesh.get_areas(i) == 0) {
        polyMesh.set_flags(i, 1);
      }
    }

    const navMeshCreateParams = new Raw.dtNavMeshCreateParams();

    Raw.DetourNavMeshBuilder.setPolyMeshCreateParams(
      navMeshCreateParams,
      polyMesh
    );
    Raw.DetourNavMeshBuilder.setPolyMeshDetailCreateParams(
      navMeshCreateParams,
      polyMeshDetail
    );

    navMeshCreateParams.walkableHeight = tileConfig.walkableHeight;
    navMeshCreateParams.walkableRadius = tileConfig.walkableRadius;
    navMeshCreateParams.walkableClimb = tileConfig.walkableClimb;

    navMeshCreateParams.cs = tileConfig.cs;
    navMeshCreateParams.ch = tileConfig.ch;

    navMeshCreateParams.buildBvTree = true;

    Raw.DetourNavMeshBuilder.setOffMeshConCount(navMeshCreateParams, 0);

    navMeshCreateParams.tileX = tx;
    navMeshCreateParams.tileY = ty;

    const createNavMeshDataResult =
      Raw.DetourNavMeshBuilder.createNavMeshData(navMeshCreateParams);

    if (!createNavMeshDataResult.success) {
      return failTileMesh('Failed to create Detour navmesh data');
    }

    buildContext.log(
      Raw.Module.RC_LOG_PROGRESS,
      `>> Polymesh: ${polyMesh.nverts} vertices  ${polyMesh.npolys} polygons`
    );

    return { success: true, data: createNavMeshDataResult.navMeshData };
  };

  buildContext.startTimer(Raw.Module.RC_TIMER_TEMP);

  let lastBuiltTileBmin: Vector3Tuple = [0, 0, 0];
  let lastBuiltTileBmax: Vector3Tuple = [0, 0, 0];

  for (let y = 0; y < tileHeight; y++) {
    for (let x = 0; x < tileWidth; x++) {
      lastBuiltTileBmin[0] = bbMin[0] + x * tcs;
      lastBuiltTileBmin[1] = bbMin[1];
      lastBuiltTileBmin[2] = bbMin[2] + y * tcs;

      lastBuiltTileBmax[0] = bbMin[0] + (x + 1) * tcs;
      lastBuiltTileBmax[1] = bbMax[1];
      lastBuiltTileBmax[2] = bbMin[2] + (y + 1) * tcs;

      const result = buildTileMesh(x, y, lastBuiltTileBmin, lastBuiltTileBmax);

      if (result.success && result.data) {
        navMesh.removeTile(navMesh.getTileRefAt(x, y, 0));

        const addTileResult = navMesh.addTile(
          result.data,
          Raw.Module.DT_TILE_FREE_DATA,
          0
        );

        if (Raw.Detour.statusFailed(addTileResult.status)) {
          result.data.free();
        }
      }
    }
  }

  buildContext.stopTimer(Raw.Module.RC_TIMER_TEMP);

  if (!keepIntermediates) {
    freeIntermediates();
  }

  return {
    success: true,
    navMesh,
    intermediates: keepIntermediates ? intermediates : undefined,
  };
};
