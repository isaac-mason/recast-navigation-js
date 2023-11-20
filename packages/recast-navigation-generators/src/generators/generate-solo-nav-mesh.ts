import {
  Arrays,
  NavMesh,
  NavMeshCreateParams,
  Raw,
  RecastBuildContext,
  RecastCompactHeightfield,
  RecastConfig,
  RecastContourSet,
  RecastHeightfield,
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
  createHeightfield,
  createNavMeshData,
  createRcConfig,
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
} from '@recast-navigation/core';
import { Pretty } from '../types';
import { OffMeshConnectionGeneratorParams, getBoundingBox } from './common';

export type SoloNavMeshGeneratorConfig = Pretty<
  Omit<RecastConfig, 'tileSize'> & OffMeshConnectionGeneratorParams
>;

export const soloNavMeshGeneratorConfigDefaults: SoloNavMeshGeneratorConfig = {
  ...recastConfigDefaults,
};

export type SoloNavMeshGeneratorIntermediates = {
  type: 'solo';
  buildContext: RecastBuildContext;
  heightfield?: RecastHeightfield;
  compactHeightfield?: RecastCompactHeightfield;
  contourSet?: RecastContourSet;
};

type SoloNavMeshGeneratorSuccessResult = {
  navMesh: NavMesh;
  success: true;
  intermediates: SoloNavMeshGeneratorIntermediates;
};

type SoloNavMeshGeneratorFailResult = {
  navMesh: undefined;
  success: false;
  intermediates: SoloNavMeshGeneratorIntermediates;
  error: string;
};

export type SoloNavMeshGeneratorResult =
  | SoloNavMeshGeneratorSuccessResult
  | SoloNavMeshGeneratorFailResult;

/**
 * Builds a Solo NavMesh from the given positions and indices.
 * @param positions a flat array of positions
 * @param indices a flat array of indices
 * @param navMeshGeneratorConfig optional configuration for the NavMesh generator
 * @param keepIntermediates if true intermediates will be returned
 */
export const generateSoloNavMesh = (
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  navMeshGeneratorConfig: Partial<SoloNavMeshGeneratorConfig> = {},
  keepIntermediates = false
): SoloNavMeshGeneratorResult => {
  const buildContext = new RecastBuildContext();

  const intermediates: SoloNavMeshGeneratorIntermediates = {
    type: 'solo',
    buildContext,
  };

  const navMesh = new NavMesh();

  const cleanup = () => {
    if (keepIntermediates) return;

    if (intermediates.heightfield) {
      freeHeightfield(intermediates.heightfield);
      intermediates.heightfield = undefined;
    }
    if (intermediates.compactHeightfield) {
      freeCompactHeightfield(intermediates.compactHeightfield);
      intermediates.compactHeightfield = undefined;
    }
    if (intermediates.contourSet) {
      freeContourSet(intermediates.contourSet);
      intermediates.contourSet = undefined;
    }
  };

  const fail = (error: string): SoloNavMeshGeneratorFailResult => {
    cleanup();

    navMesh.destroy();

    return {
      navMesh: undefined,
      success: false,
      intermediates,
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

  //
  // Step 1. Initialize build config.
  //
  const config = createRcConfig({
    ...soloNavMeshGeneratorConfigDefaults,
    ...navMeshGeneratorConfig,
  });

  config.minRegionArea = config.minRegionArea * config.minRegionArea; // Note: area = size*size
  config.mergeRegionArea = config.mergeRegionArea * config.mergeRegionArea; // Note: area = size*size
  config.detailSampleDist =
    config.detailSampleDist < 0.9 ? 0 : config.cs * config.detailSampleDist;
  config.detailSampleMaxError = config.ch * config.detailSampleMaxError;

  const gridSize = Raw.Recast.calcGridSize(bbMin, bbMax, config.cs);
  config.width = gridSize.width;
  config.height = gridSize.height;

  //
  // Step 2. Rasterize input polygon soup.
  //
  // Allocate voxel heightfield where we rasterize our input data to.
  const heightfield = allocHeightfield();
  intermediates.heightfield = heightfield;

  if (
    !createHeightfield(
      buildContext,
      heightfield,
      config.width,
      config.height,
      bbMin,
      bbMax,
      config.cs,
      config.ch
    )
  ) {
    return fail('Could not create heightfield');
  }

  // Find triangles which are walkable based on their slope and rasterize them.
  // If your input data is multiple meshes, you can transform them here, calculate
  // the are type for each of the meshes and rasterize them.
  const triAreasArray = new Arrays.UnsignedCharArray();
  triAreasArray.resize(nTris);

  markWalkableTriangles(
    buildContext,
    config.walkableSlopeAngle,
    vertsArray,
    nVerts,
    trisArray,
    nTris,
    triAreasArray
  );

  if (
    !rasterizeTriangles(
      buildContext,
      vertsArray,
      nVerts,
      trisArray,
      triAreasArray,
      nTris,
      heightfield,
      config.walkableClimb
    )
  ) {
    return fail('Could not rasterize triangles');
  }

  triAreasArray.free();

  //
  // Step 3. Filter walkables surfaces.
  //
  // Once all geoemtry is rasterized, we do initial pass of filtering to
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

  //
  // Step 4. Partition walkable surface to simple regions.
  //
  // Compact the heightfield so that it is faster to handle from now on.
  // This will result more cache coherent data as well as the neighbours
  // between walkable cells will be calculated.
  const compactHeightfield = allocCompactHeightfield();
  intermediates.compactHeightfield = compactHeightfield;

  if (
    !buildCompactHeightfield(
      buildContext,
      config.walkableHeight,
      config.walkableClimb,
      heightfield,
      compactHeightfield
    )
  ) {
    return fail('Failed to build compact data');
  }

  if (!keepIntermediates) {
    freeHeightfield(heightfield);
    intermediates.heightfield = undefined;
  }

  // Erode the walkable area by agent radius.
  if (
    !erodeWalkableArea(buildContext, config.walkableRadius, compactHeightfield)
  ) {
    return fail('Failed to erode walkable area');
  }

  // (Optional) Mark areas
  // markConvexPolyArea(...)

  // Prepare for region partitioning, by calculating Distance field along the walkable surface.
  if (!buildDistanceField(buildContext, compactHeightfield)) {
    return fail('Failed to build distance field');
  }

  // Partition the walkable surface into simple regions without holes.
  if (
    !buildRegions(
      buildContext,
      compactHeightfield,
      config.borderSize,
      config.minRegionArea,
      config.mergeRegionArea
    )
  ) {
    return fail('Failed to build regions');
  }

  //
  // Step 5. Trace and simplify region contours.
  //
  const contourSet = allocContourSet();
  intermediates.contourSet = contourSet;

  if (
    !buildContours(
      buildContext,
      compactHeightfield,
      config.maxSimplificationError,
      config.maxEdgeLen,
      contourSet,
      Raw.Module.RC_CONTOUR_TESS_WALL_EDGES
    )
  ) {
    return fail('Failed to create contours');
  }

  //
  // Step 6. Build polygons mesh from contours.
  //
  const polyMesh = allocPolyMesh();
  if (
    !buildPolyMesh(buildContext, contourSet, config.maxVertsPerPoly, polyMesh)
  ) {
    return fail('Failed to triangulate contours');
  }

  //
  // Step 7. Create detail mesh which allows to access approximate height on each polygon.
  //
  const polyMeshDetail = allocPolyMeshDetail();
  if (
    !buildPolyMeshDetail(
      buildContext,
      polyMesh,
      compactHeightfield,
      config.detailSampleDist,
      config.detailSampleMaxError,
      polyMeshDetail
    )
  ) {
    return fail('Failed to build detail mesh');
  }

  if (!keepIntermediates) {
    freeCompactHeightfield(compactHeightfield);
    intermediates.compactHeightfield = undefined;

    freeContourSet(contourSet);
    intermediates.contourSet = undefined;
  }

  //
  // Step 8. Create Detour data from Recast poly mesh.
  //
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

  navMeshCreateParams.setWalkableHeight(config.walkableHeight);
  navMeshCreateParams.setWalkableRadius(config.walkableRadius);
  navMeshCreateParams.setWalkableClimb(config.walkableClimb);

  navMeshCreateParams.setCellSize(config.cs);
  navMeshCreateParams.setCellHeight(config.ch);

  navMeshCreateParams.setBuildBvTree(true);

  if (navMeshGeneratorConfig.offMeshConnections) {
    navMeshCreateParams.setOffMeshConnections(
      navMeshGeneratorConfig.offMeshConnections
    );
  }

  const createNavMeshDataResult = createNavMeshData(navMeshCreateParams);

  if (!createNavMeshDataResult.success) {
    return fail('Failed to create Detour navmesh data');
  }

  const { navMeshData } = createNavMeshDataResult;

  if (!navMesh.initSolo(navMeshData)) {
    return fail('Failed to create Detour navmesh');
  }

  return {
    success: true,
    navMesh,
    intermediates,
  };
};
