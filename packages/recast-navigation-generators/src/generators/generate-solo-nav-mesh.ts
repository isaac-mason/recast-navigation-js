import {
  NavMesh,
  NavMeshCreateParams,
  Raw,
  Recast,
  RecastBuildContext,
  RecastCompactHeightfield,
  RecastConfig,
  RecastContourSet,
  RecastHeightfield,
  RecastPolyMesh,
  RecastPolyMeshDetail,
  TriangleAreasArray,
  TrianglesArray,
  UnsignedCharArray,
  Vector3Tuple,
  VerticesArray,
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
  freePolyMesh,
  freePolyMeshDetail,
  markWalkableTriangles,
  rasterizeTriangles,
  recastConfigDefaults,
} from '@recast-navigation/core';
import { Pretty } from '../types';
import { OffMeshConnectionGeneratorParams, getBoundingBox } from './common';

export type SoloNavMeshGeneratorConfig = Pretty<
  Omit<RecastConfig, 'tileSize'> &
    OffMeshConnectionGeneratorParams & {
      /**
       * @default true
       */
      buildBvTree?: boolean;

      /**
       * The minimum and maximum bounds of the heightfield's AABB in world units.
       * If not provided, the bounding box will be calculated from the input positions and indices
       */
      bounds?: [bbMin: Vector3Tuple, bbMax: Vector3Tuple];
    }
>;

export const soloNavMeshGeneratorConfigDefaults = {
  ...recastConfigDefaults,
  buildBvTree: true,
} satisfies SoloNavMeshGeneratorConfig;

export type SoloNavMeshGeneratorIntermediates = {
  type: 'solo';
  buildContext: RecastBuildContext;
  heightfield?: RecastHeightfield;
  compactHeightfield?: RecastCompactHeightfield;
  contourSet?: RecastContourSet;
  polyMesh?: RecastPolyMesh;
  polyMeshDetail?: RecastPolyMeshDetail;
};

type GenerateSoloNavMeshDataSuccessResult = {
  navMeshData: UnsignedCharArray;
  success: true;
  intermediates: SoloNavMeshGeneratorIntermediates;
};

type GenerateSoloNavMeshDataFailResult = {
  navMeshData: undefined;
  success: false;
  intermediates: SoloNavMeshGeneratorIntermediates;
  error: string;
};

export type GenerateSoloNavMeshDataResult =
  | GenerateSoloNavMeshDataSuccessResult
  | GenerateSoloNavMeshDataFailResult;

/**
 * Builds Solo NavMesh data from the given positions and indices.
 * @param positions a flat array of positions
 * @param indices a flat array of indices
 * @param navMeshGeneratorConfig optional configuration for the NavMesh generator
 * @param keepIntermediates if true intermediates will be returned
 */
export const generateSoloNavMeshData = (
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  navMeshGeneratorConfig: Partial<SoloNavMeshGeneratorConfig> = {},
  keepIntermediates = false,
): GenerateSoloNavMeshDataResult => {
  const buildContext = new RecastBuildContext();

  const intermediates: SoloNavMeshGeneratorIntermediates = {
    type: 'solo',
    buildContext,
  };

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

    if (intermediates.polyMesh) {
      freePolyMesh(intermediates.polyMesh);
      intermediates.polyMesh = undefined;
    }

    if (intermediates.polyMeshDetail) {
      freePolyMeshDetail(intermediates.polyMeshDetail);
      intermediates.polyMeshDetail = undefined;
    }
  };

  const fail = (error: string): GenerateSoloNavMeshDataFailResult => {
    cleanup();

    return {
      navMeshData: undefined,
      success: false,
      intermediates,
      error,
    };
  };

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

  //
  // Step 1. Initialize build config.
  //
  const config = {
    ...soloNavMeshGeneratorConfigDefaults,
    ...navMeshGeneratorConfig,
  };
  const rcConfig = createRcConfig(config);

  rcConfig.minRegionArea = rcConfig.minRegionArea * rcConfig.minRegionArea; // Note: area = size*size
  rcConfig.mergeRegionArea =
    rcConfig.mergeRegionArea * rcConfig.mergeRegionArea; // Note: area = size*size
  rcConfig.detailSampleDist =
    rcConfig.detailSampleDist < 0.9
      ? 0
      : rcConfig.cs * rcConfig.detailSampleDist;
  rcConfig.detailSampleMaxError = rcConfig.ch * rcConfig.detailSampleMaxError;

  const gridSize = calcGridSize(bbMin, bbMax, rcConfig.cs);
  rcConfig.width = gridSize.width;
  rcConfig.height = gridSize.height;

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
      rcConfig.width,
      rcConfig.height,
      bbMin,
      bbMax,
      rcConfig.cs,
      rcConfig.ch,
    )
  ) {
    return fail('Could not create heightfield');
  }

  // Find triangles which are walkable based on their slope and rasterize them.
  // If your input data is multiple meshes, you can transform them here, calculate
  // the are type for each of the meshes and rasterize them.
  const triangleAreasArray = new TriangleAreasArray();
  triangleAreasArray.resize(numTriangles);

  markWalkableTriangles(
    buildContext,
    rcConfig.walkableSlopeAngle,
    verticesArray,
    numVertices,
    trianglesArray,
    numTriangles,
    triangleAreasArray,
  );

  if (
    !rasterizeTriangles(
      buildContext,
      verticesArray,
      numVertices,
      trianglesArray,
      triangleAreasArray,
      numTriangles,
      heightfield,
      rcConfig.walkableClimb,
    )
  ) {
    return fail('Could not rasterize triangles');
  }

  triangleAreasArray.destroy();
  verticesArray.destroy();
  trianglesArray.destroy();

  //
  // Step 3. Filter walkables surfaces.
  //
  // Once all geoemtry is rasterized, we do initial pass of filtering to
  // remove unwanted overhangs caused by the conservative rasterization
  // as well as filter spans where the character cannot possibly stand.
  filterLowHangingWalkableObstacles(
    buildContext,
    rcConfig.walkableClimb,
    heightfield,
  );
  filterLedgeSpans(
    buildContext,
    rcConfig.walkableHeight,
    rcConfig.walkableClimb,
    heightfield,
  );
  filterWalkableLowHeightSpans(
    buildContext,
    rcConfig.walkableHeight,
    heightfield,
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
      rcConfig.walkableHeight,
      rcConfig.walkableClimb,
      heightfield,
      compactHeightfield,
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
    !erodeWalkableArea(
      buildContext,
      rcConfig.walkableRadius,
      compactHeightfield,
    )
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
      rcConfig.borderSize,
      rcConfig.minRegionArea,
      rcConfig.mergeRegionArea,
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
      rcConfig.maxSimplificationError,
      rcConfig.maxEdgeLen,
      contourSet,
      Recast.RC_CONTOUR_TESS_WALL_EDGES,
    )
  ) {
    return fail('Failed to create contours');
  }

  //
  // Step 6. Build polygons mesh from contours.
  //
  const polyMesh = allocPolyMesh();
  intermediates.polyMesh = polyMesh;
  if (
    !buildPolyMesh(buildContext, contourSet, rcConfig.maxVertsPerPoly, polyMesh)
  ) {
    return fail('Failed to triangulate contours');
  }

  //
  // Step 7. Create detail mesh which allows to access approximate height on each polygon.
  //
  const polyMeshDetail = allocPolyMeshDetail();
  intermediates.polyMeshDetail = polyMeshDetail;
  if (
    !buildPolyMeshDetail(
      buildContext,
      polyMesh,
      compactHeightfield,
      rcConfig.detailSampleDist,
      rcConfig.detailSampleMaxError,
      polyMeshDetail,
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
    if (polyMesh.areas(i) == Recast.RC_WALKABLE_AREA) {
      polyMesh.setAreas(i, 0);
    }
    if (polyMesh.areas(i) == 0) {
      polyMesh.setFlags(i, 1);
    }
  }

  const navMeshCreateParams = new NavMeshCreateParams();

  navMeshCreateParams.setPolyMeshCreateParams(polyMesh);
  navMeshCreateParams.setPolyMeshDetailCreateParams(polyMeshDetail);

  navMeshCreateParams.setWalkableHeight(rcConfig.walkableHeight * rcConfig.ch);
  navMeshCreateParams.setWalkableRadius(rcConfig.walkableRadius * rcConfig.cs);
  navMeshCreateParams.setWalkableClimb(rcConfig.walkableClimb * rcConfig.ch);

  navMeshCreateParams.setCellSize(rcConfig.cs);
  navMeshCreateParams.setCellHeight(rcConfig.ch);

  navMeshCreateParams.setBuildBvTree(config.buildBvTree);

  if (navMeshGeneratorConfig.offMeshConnections) {
    navMeshCreateParams.setOffMeshConnections(
      navMeshGeneratorConfig.offMeshConnections,
    );
  }

  const createNavMeshDataResult = createNavMeshData(navMeshCreateParams);

  if (!createNavMeshDataResult.success) {
    return fail('Failed to create Detour navmesh data');
  }

  cleanup();

  return {
    navMeshData: createNavMeshDataResult.navMeshData,
    success: true,
    intermediates,
  };
};

type GenerateSoloNavMeshSuccessResult = {
  navMesh: NavMesh;
  success: true;
  intermediates: SoloNavMeshGeneratorIntermediates;
};

type GenerateSoloNavMeshFailResult = {
  navMesh: undefined;
  success: false;
  intermediates: SoloNavMeshGeneratorIntermediates;
  error: string;
};

export type GenerateSoloNavMeshResult =
  | GenerateSoloNavMeshSuccessResult
  | GenerateSoloNavMeshFailResult;

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
  keepIntermediates = false,
): GenerateSoloNavMeshResult => {
  if (!Raw.Module) {
    throw new Error(
      '"init" must be called before using any recast-navigation-js APIs. See: https://github.com/isaac-mason/recast-navigation-js?tab=readme-ov-file#initialization',
    );
  }

  const createNavMeshDataResult = generateSoloNavMeshData(
    positions,
    indices,
    navMeshGeneratorConfig,
    keepIntermediates,
  );

  if (!createNavMeshDataResult.success) {
    return {
      navMesh: undefined,
      success: false,
      intermediates: createNavMeshDataResult.intermediates,
      error: createNavMeshDataResult.error,
    };
  }

  const { navMeshData } = createNavMeshDataResult;

  const navMesh = new NavMesh();

  if (!navMesh.initSolo(navMeshData)) {
    navMeshData.destroy();

    return {
      navMesh: undefined,
      success: false,
      intermediates: createNavMeshDataResult.intermediates,
      error: 'Failed to initialize solo NavMesh',
    };
  }

  return {
    success: true,
    navMesh,
    intermediates: createNavMeshDataResult.intermediates,
  };
};
