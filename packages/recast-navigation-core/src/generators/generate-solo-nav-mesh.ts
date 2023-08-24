import { NavMesh } from '../nav-mesh';
import { Raw } from '../raw';
import {
  RecastConfigType,
  RecastCompactHeightfield,
  RecastConfig,
  RecastContourSet,
  RecastHeightfield,
  recastConfigDefaults,
} from '../recast';
import { getVertsAndTris } from './common';

export type SoloNavMeshGeneratorConfig = Omit<RecastConfigType, 'tileSize'>;

export const soloNavMeshGeneratorConfigDefaults: SoloNavMeshGeneratorConfig = {
  ...recastConfigDefaults,
};

export type SoloNavMeshGeneratorIntermediates = {
  heightfield?: RecastHeightfield;
  compactHeightfield?: RecastCompactHeightfield;
  contourSet?: RecastContourSet;
};

type SoloNavMeshGeneratorSuccessResult = {
  navMesh: NavMesh;
  success: true;
  intermediates?: SoloNavMeshGeneratorIntermediates;
};

type SoloNavMeshGeneratorFailResult = {
  navMesh: undefined;
  success: false;
  intermediates?: SoloNavMeshGeneratorIntermediates;
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
  const intermediates: Partial<SoloNavMeshGeneratorIntermediates> = {};

  const fail = (error: string): SoloNavMeshGeneratorFailResult => {
    if (!keepIntermediates) {
      if (intermediates.heightfield) {
        Raw.Recast.freeHeightfield(intermediates.heightfield.raw);
      }
      if (intermediates.compactHeightfield) {
        Raw.Recast.freeCompactHeightfield(intermediates.compactHeightfield.raw);
      }
      if (intermediates.contourSet) {
        Raw.Recast.freeContourSet(intermediates.contourSet.raw);
      }
    }

    return {
      navMesh: undefined,
      success: false,
      intermediates: keepIntermediates
        ? (intermediates as SoloNavMeshGeneratorIntermediates)
        : undefined,
      error,
    };
  };

  const { verts, nVerts, tris, nTris, bbMin, bbMax } = getVertsAndTris(
    positions,
    indices
  );

  const vertsArray = new Raw.Arrays.FloatArray();
  vertsArray.copy(verts, verts.length);

  const trisArray = new Raw.Arrays.IntArray();
  trisArray.copy(tris, tris.length);

  //
  // Step 1. Initialize build config.
  //
  const { raw: config } = RecastConfig.create({
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

  const rcContext = new Raw.rcContext();

  //
  // Step 2. Rasterize input polygon soup.
  //
  // Allocate voxel heightfield where we rasterize our input data to.
  const heightfield = Raw.Recast.allocHeightfield();
  intermediates.heightfield = new RecastHeightfield(heightfield);

  if (
    !Raw.Recast.createHeightfield(
      rcContext,
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
  const triAreasArray = new Raw.Arrays.UnsignedCharArray();
  triAreasArray.resize(nTris);

  Raw.Recast.markWalkableTriangles(
    rcContext,
    config.walkableSlopeAngle,
    vertsArray,
    nVerts,
    trisArray,
    nTris,
    triAreasArray
  );

  if (
    !Raw.Recast.rasterizeTriangles(
      rcContext,
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

  //
  // Step 4. Partition walkable surface to simple regions.
  //
  // Compact the heightfield so that it is faster to handle from now on.
  // This will result more cache coherent data as well as the neighbours
  // between walkable cells will be calculated.
  const compactHeightfield = Raw.Recast.allocCompactHeightfield();
  intermediates.compactHeightfield = new RecastCompactHeightfield(
    compactHeightfield
  );

  if (
    !Raw.Recast.buildCompactHeightfield(
      rcContext,
      config.walkableHeight,
      config.walkableClimb,
      heightfield,
      compactHeightfield
    )
  ) {
    return fail('Failed to build compact data');
  }

  // Erode the walkable area by agent radius.
  if (
    !Raw.Recast.erodeWalkableArea(
      rcContext,
      config.walkableRadius,
      compactHeightfield
    )
  ) {
    return fail('Failed to erode walkable area');
  }

  // Prepare for region partitioning, by calculating Distance field along the walkable surface.
  if (!Raw.Recast.buildDistanceField(rcContext, compactHeightfield)) {
    return fail('Failed to build distance field');
  }

  // Partition the walkable surface into simple regions without holes.
  if (
    !Raw.Recast.buildRegions(
      rcContext,
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
  const contourSet = Raw.Recast.allocContourSet();
  intermediates.contourSet = new RecastContourSet(contourSet);

  if (
    !Raw.Recast.buildContours(
      rcContext,
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
  const polyMesh = Raw.Recast.allocPolyMesh();
  if (
    !Raw.Recast.buildPolyMesh(
      rcContext,
      contourSet,
      config.maxVertsPerPoly,
      polyMesh
    )
  ) {
    return fail('Failed to triangulate contours');
  }

  //
  // Step 7. Create detail mesh which allows to access approximate height on each polygon.
  //
  const polyMeshDetail = Raw.Recast.allocPolyMeshDetail();
  if (
    !Raw.Recast.buildPolyMeshDetail(
      rcContext,
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
    Raw.Recast.freeHeightfield(heightfield);
    Raw.Recast.freeCompactHeightfield(compactHeightfield);
    Raw.Recast.freeContourSet(contourSet);
  }

  //
  // Step 8. Create Detour data from Recast poly mesh.
  //
  for (let i = 0; i < polyMesh.npolys; i++) {
    if (polyMesh.get_areas(i) == Raw.Recast.WALKABLE_AREA) {
      polyMesh.set_areas(i, 0);
    }
    if (polyMesh.get_areas(i) == 0) {
      polyMesh.set_flags(i, 1);
    }
  }

  const detourNavMeshCreateParams = new Raw.dtNavMeshCreateParams();

  Raw.DetourNavMeshBuilder.setSoloNavMeshCreateParams(
    detourNavMeshCreateParams,
    polyMesh,
    polyMeshDetail,
    config
  );
  Raw.DetourNavMeshBuilder.setOffMeshConCount(detourNavMeshCreateParams, 0);

  const createNavMeshDataResult = Raw.DetourNavMeshBuilder.createNavMeshData(
    detourNavMeshCreateParams
  );

  if (!createNavMeshDataResult.success) {
    return fail('Failed to create Detour navmesh data');
  }

  const navMesh = new NavMesh();

  const navMeshData = createNavMeshDataResult.navMeshData;
  if (!navMesh.initSolo(navMeshData)) {
    return fail('Failed to create Detour navmesh');
  }

  return {
    success: true,
    navMesh,
    intermediates: keepIntermediates ? intermediates : undefined,
  };
};
