import {
  Arrays,
  NavMesh,
  NavMeshCreateParams,
  NavMeshParams,
  Raw,
  RecastBuildContext,
  RecastChunkyTriMesh,
  RecastCompactHeightfield,
  RecastConfig,
  RecastContourSet,
  RecastHeightfield,
  Vector2Tuple,
  Vector3Tuple,
  allocCompactHeightfield,
  allocContourSet,
  allocHeightfield,
  allocPolyMesh,
  allocPolyMeshDetail,
  buildCompactHeightfield,
  buildContours,
  buildDistanceField,
  buildPolyMesh,
  buildPolyMeshDetail,
  buildRegions,
  calcGridSize,
  cloneRcConfig,
  createHeightfield,
  createNavMeshData,
  createRcConfig,
  statusToReadableString,
  erodeWalkableArea,
  filterLedgeSpans,
  filterLowHangingWalkableObstacles,
  filterWalkableLowHeightSpans,
  freeCompactHeightfield,
  freeContourSet,
  freeHeightfield,
  markWalkableTriangles,
  rasterizeTriangles,
  recastConfigDefaults,
  vec3,
  RecastPolyMesh,
  RecastPolyMeshDetail,
  freePolyMesh,
  freePolyMeshDetail,
} from '@recast-navigation/core';
import type R from '@recast-navigation/wasm';
import { Pretty } from '../types';
import {
  OffMeshConnectionGeneratorParams,
  dtIlog2,
  dtNextPow2,
  getBoundingBox,
} from './common';

export type TiledNavMeshGeneratorConfig = Pretty<
  RecastConfig & OffMeshConnectionGeneratorParams
>;

export const tiledNavMeshGeneratorConfigDefaults: TiledNavMeshGeneratorConfig =
  {
    ...recastConfigDefaults,
  };

type TileIntermediates = {
  tileX: number;
  tileY: number;
  heightfield?: RecastHeightfield;
  compactHeightfield?: RecastCompactHeightfield;
  contourSet?: RecastContourSet;
  polyMesh?: RecastPolyMesh;
  polyMeshDetail?: RecastPolyMeshDetail;
};

export type TiledNavMeshGeneratorIntermediates = {
  type: 'tiled';
  buildContext: RecastBuildContext;
  chunkyTriMesh?: RecastChunkyTriMesh;
  tileIntermediates: TileIntermediates[];
};

type TiledNavMeshGeneratorSuccessResult = {
  navMesh: NavMesh;
  success: true;
  intermediates: TiledNavMeshGeneratorIntermediates;
};

type TiledNavMeshGeneratorFailResult = {
  navMesh: undefined;
  success: false;
  intermediates: TiledNavMeshGeneratorIntermediates;
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
  const buildContext = new RecastBuildContext();

  const intermediates: TiledNavMeshGeneratorIntermediates = {
    type: 'tiled',
    buildContext,
    chunkyTriMesh: undefined,
    tileIntermediates: [],
  };

  const navMesh = new NavMesh();

  const cleanup = () => {
    if (keepIntermediates) return;

    for (let i = 0; i < intermediates.tileIntermediates.length; i++) {
      const tileIntermediate = intermediates.tileIntermediates[i];

      if (tileIntermediate.compactHeightfield) {
        freeCompactHeightfield(tileIntermediate.compactHeightfield);
      }

      if (tileIntermediate.heightfield) {
        freeHeightfield(tileIntermediate.heightfield);
      }

      if (tileIntermediate.contourSet) {
        freeContourSet(tileIntermediate.contourSet);
      }

      if (tileIntermediate.polyMesh) {
        freePolyMesh(tileIntermediate.polyMesh);
      }

      if (tileIntermediate.polyMeshDetail) {
        freePolyMeshDetail(tileIntermediate.polyMeshDetail);
      }
    }

    if (intermediates.chunkyTriMesh) {
      intermediates.chunkyTriMesh = undefined;
    }
  };

  const fail = (error: string): TiledNavMeshGeneratorFailResult => {
    cleanup();

    navMesh.destroy();

    return {
      success: false,
      navMesh: undefined,
      intermediates,
      error,
    };
  };

  //
  // Initialize build config.
  //
  const config = createRcConfig({
    ...tiledNavMeshGeneratorConfigDefaults,
    ...navMeshGeneratorConfig,
  });

  /* get input bounding box */
  const { bbMin, bbMax } = getBoundingBox(positions, indices);

  /* grid size */
  const gridSize = calcGridSize(bbMin, bbMax, config.cs);
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
  const vertsArray = new Arrays.VertsArray();
  vertsArray.copy(verts, verts.length);

  /* tris */
  const tris = indices as number[];
  const nTris = indices.length / 3;
  const trisArray = new Arrays.TrisArray();
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
  const chunkyTriMesh = new RecastChunkyTriMesh();
  intermediates.chunkyTriMesh = chunkyTriMesh;

  if (!chunkyTriMesh.init(vertsArray, trisArray, nTris, 256)) {
    return fail('Failed to build chunky triangle mesh');
  }

  /** @internal */
  const buildTileMesh = (
    tileX: number,
    tileY: number,
    tileBoundsMin: Vector3Tuple,
    tileBoundsMax: Vector3Tuple
  ):
    | { success: true; data?: R.UnsignedCharArray }
    | { success: false; error: string } => {
    const failTileMesh = (error: string) => {
      buildContext.log(Raw.Module.RC_LOG_ERROR, error);

      return { success: false as const, error };
    };

    const tileIntermediate: TileIntermediates = { tileX, tileY };

    intermediates.tileIntermediates.push(tileIntermediate);

    const tileConfig = cloneRcConfig(config);

    // Expand the heightfield bounding box by border size to find the extents of geometry we need to build this tile.
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

    const expandedTileBoundsMin = [...tileBoundsMin] as Vector3Tuple;
    const expandedTileBoundsMax = [...tileBoundsMax] as Vector3Tuple;

    expandedTileBoundsMin[0] -= tileConfig.borderSize * tileConfig.cs;
    expandedTileBoundsMin[2] -= tileConfig.borderSize * tileConfig.cs;

    expandedTileBoundsMax[0] += tileConfig.borderSize * tileConfig.cs;
    expandedTileBoundsMax[2] += tileConfig.borderSize * tileConfig.cs;

    tileConfig.set_bmin(0, expandedTileBoundsMin[0]);
    tileConfig.set_bmin(1, expandedTileBoundsMin[1]);
    tileConfig.set_bmin(2, expandedTileBoundsMin[2]);

    tileConfig.set_bmax(0, expandedTileBoundsMax[0]);
    tileConfig.set_bmax(1, expandedTileBoundsMax[1]);
    tileConfig.set_bmax(2, expandedTileBoundsMax[2]);

    // Reset build timer
    buildContext.resetTimers();

    // Start the build process
    buildContext.startTimer(Raw.Module.RC_TIMER_TOTAL);

    buildContext.log(
      Raw.Module.RC_LOG_PROGRESS,
      `Building tile ${intermediates.tileIntermediates.length} at x: ${tileX}, y: ${tileY}`
    );
    buildContext.log(
      Raw.Module.RC_LOG_PROGRESS,
      ` - ${config.width} x ${config.height} cells`
    );
    buildContext.log(
      Raw.Module.RC_LOG_PROGRESS,
      ` - ${nVerts / 1000}fK verts, ${nTris / 1000}K tris`
    );

    // Allocate voxel heightfield where we rasterize our input data to.
    const heightfield = allocHeightfield();
    tileIntermediate.heightfield = heightfield;

    if (
      !createHeightfield(
        buildContext,
        heightfield,
        tileConfig.width,
        tileConfig.height,
        expandedTileBoundsMin,
        expandedTileBoundsMax,
        tileConfig.cs,
        tileConfig.ch
      )
    ) {
      return failTileMesh('Could not create heightfield');
    }

    // Allocate array that can hold triangle flags.
    // If you have multiple meshes you need to process, allocate
    // and array which can hold the max number of triangles you need to process.
    const triAreas = new Arrays.TriAreasArray();
    triAreas.resize(chunkyTriMesh.maxTrisPerChunk());

    const tbmin: Vector2Tuple = [
      expandedTileBoundsMin[0],
      expandedTileBoundsMin[2],
    ];
    const tbmax: Vector2Tuple = [
      expandedTileBoundsMax[0],
      expandedTileBoundsMax[2],
    ];

    // TODO: Make grow when returning too many items.
    const maxChunkIds = 512;
    const chunkIdsArray = new Arrays.ChunkIdsArray();
    chunkIdsArray.resize(maxChunkIds);

    const nChunksOverlapping = chunkyTriMesh.getChunksOverlappingRect(
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
      const node = chunkyTriMesh.nodes(nodeId);
      const nNodeTris = node.n;

      const nodeTrisArray = chunkyTriMesh.getNodeTris(nodeId);

      const triAreasArray = new Arrays.TriAreasArray();
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
        return failTileMesh('Could not rasterize triangles');
      }
    }

    // Once all geometry is rasterized, we do initial pass of filtering to
    // remove unwanted overhangs caused by the conservative rasterization
    // as well as filter spans where the character cannot possibly stand.
    filterLowHangingWalkableObstacles(
      buildContext,
      tileConfig.walkableClimb,
      heightfield
    );
    filterLedgeSpans(
      buildContext,
      tileConfig.walkableHeight,
      tileConfig.walkableClimb,
      heightfield
    );
    filterWalkableLowHeightSpans(
      buildContext,
      tileConfig.walkableHeight,
      heightfield
    );

    // Compact the heightfield so that it is faster to handle from now on.
    // This will result more cache coherent data as well as the neighbours
    // between walkable cells will be calculated.
    const compactHeightfield = allocCompactHeightfield();
    tileIntermediate.compactHeightfield = compactHeightfield;

    if (
      !buildCompactHeightfield(
        buildContext,
        tileConfig.walkableHeight,
        tileConfig.walkableClimb,
        heightfield,
        compactHeightfield
      )
    ) {
      return failTileMesh('Could not build compact heightfield');
    }

    if (!keepIntermediates) {
      freeHeightfield(tileIntermediate.heightfield);
      tileIntermediate.heightfield = undefined;
    }

    // Erode the walkable area by agent radius
    if (
      !erodeWalkableArea(
        buildContext,
        tileConfig.walkableRadius,
        compactHeightfield
      )
    ) {
      return failTileMesh('Could not erode walkable area');
    }

    // (Optional) Mark areas
    // markConvexPolyArea(...)

    // Prepare for region partitioning, by calculating Distance field along the walkable surface.
    if (!buildDistanceField(buildContext, compactHeightfield)) {
      return failTileMesh('Failed to build distance field');
    }

    // Partition the walkable surface into simple regions without holes.
    if (
      !buildRegions(
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
    const contourSet = allocContourSet();
    tileIntermediate.contourSet = contourSet;

    if (
      !buildContours(
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
    const polyMesh = allocPolyMesh();
    tileIntermediate.polyMesh = polyMesh;
    if (
      !buildPolyMesh(
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
    const polyMeshDetail = allocPolyMeshDetail();
    tileIntermediate.polyMeshDetail = polyMeshDetail;
    if (
      !buildPolyMeshDetail(
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

    if (!keepIntermediates) {
      freeCompactHeightfield(compactHeightfield);
      tileIntermediate.compactHeightfield = undefined;

      freeContourSet(contourSet);
      tileIntermediate.contourSet = undefined;
    }

    // Update poly flags from areas.
    for (let i = 0; i < polyMesh.npolys(); i++) {
      if (polyMesh.areas(i) == Raw.Recast.WALKABLE_AREA) {
        polyMesh.setAreas(i, 0);
      }
      if (polyMesh.areas(i) == 0) {
        polyMesh.setFlags(i, 1);
      }
    }

    const navMeshCreateParams = new NavMeshCreateParams();

    navMeshCreateParams.setPolyMeshCreateParams(polyMesh);
    navMeshCreateParams.setPolyMeshDetailCreateParams(polyMeshDetail);

    navMeshCreateParams.setWalkableHeight(tileConfig.walkableHeight);
    navMeshCreateParams.setWalkableRadius(tileConfig.walkableRadius);
    navMeshCreateParams.setWalkableClimb(tileConfig.walkableClimb);

    navMeshCreateParams.setCellSize(tileConfig.cs);
    navMeshCreateParams.setCellHeight(tileConfig.ch);

    navMeshCreateParams.setBuildBvTree(true);

    if (navMeshGeneratorConfig.offMeshConnections) {
      navMeshCreateParams.setOffMeshConnections(
        navMeshGeneratorConfig.offMeshConnections
      );
    }

    navMeshCreateParams.setTileX(tileX);
    navMeshCreateParams.setTileY(tileY);

    const createNavMeshDataResult = createNavMeshData(navMeshCreateParams);

    if (!createNavMeshDataResult.success) {
      return failTileMesh('Failed to create Detour navmesh data');
    }

    buildContext.log(
      Raw.Module.RC_LOG_PROGRESS,
      `>> Polymesh: ${polyMesh.nverts()} vertices  ${polyMesh.npolys()} polygons`
    );

    return { success: true, data: createNavMeshDataResult.navMeshData };
  };

  buildContext.startTimer(Raw.Module.RC_TIMER_TEMP);

  const lastBuiltTileBmin: Vector3Tuple = [0, 0, 0];
  const lastBuiltTileBmax: Vector3Tuple = [0, 0, 0];

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
          buildContext.log(
            Raw.Module.RC_LOG_WARNING,
            `Failed to add tile to nav mesh` +
              '\n\t' +
              `tx: ${x}, ty: ${y},` +
              `status: ${statusToReadableString(addTileResult.status)} (${
                addTileResult.status
              })`
          );

          result.data.free();
        }
      }
    }
  }

  buildContext.stopTimer(Raw.Module.RC_TIMER_TEMP);

  if (!keepIntermediates) {
    cleanup();
  }

  return {
    success: true,
    navMesh,
    intermediates,
  };
};
