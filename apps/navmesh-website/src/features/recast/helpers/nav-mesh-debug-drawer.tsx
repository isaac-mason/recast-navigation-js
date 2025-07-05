import { useEffect, useState } from 'react';
import type {
  NavMesh,
  RecastCompactHeightfield,
  RecastContourSet,
  RecastHeightfield,
  RecastPolyMesh,
  RecastPolyMeshDetail,
} from 'recast-navigation';
import type {
  SoloNavMeshGeneratorIntermediates,
  TileCacheGeneratorIntermediates,
  TiledNavMeshGeneratorIntermediates,
} from 'recast-navigation/generators';
import { DebugDrawer } from '@recast-navigation/three';

export const DebugDrawerOption = {
  HEIGHTFIELD_SOLID: 'heightfield solid',
  HEIGHTFIELD_WALKABLE: 'heightfield walkable',
  COMPACT_HEIGHTFIELD_SOLID: 'compact heightfield solid',
  COMPACT_HEIGHTFIELD_REGIONS: 'compact heightfield regions',
  COMPACT_HEIGHTFIELD_DISTANCE: 'compact heightfield distance',
  RAW_CONTOURS: 'raw contours',
  CONTOURS: 'contours',
  POLY_MESH: 'poly mesh',
  POLY_MESH_DETAIL: 'poly mesh detail',
  NAVMESH: 'navmesh',
  NAVMESH_BV_TREE: 'navmesh bv tree',
};

const getIntermediates = (
  intermediates:
    | SoloNavMeshGeneratorIntermediates
    | TiledNavMeshGeneratorIntermediates
    | TileCacheGeneratorIntermediates
    | undefined,
) => {
  const heightfieldList: RecastHeightfield[] = [];
  const compactHeightfieldList: RecastCompactHeightfield[] = [];
  const contourSetList: RecastContourSet[] = [];
  const polyMeshList: RecastPolyMesh[] = [];
  const polyMeshDetailList: RecastPolyMeshDetail[] = [];

  if (intermediates) {
    if (intermediates.type === 'solo') {
      if (intermediates.heightfield) {
        heightfieldList.push(intermediates.heightfield);
      }

      if (intermediates.compactHeightfield) {
        compactHeightfieldList.push(intermediates.compactHeightfield);
      }

      if (intermediates.contourSet) {
        contourSetList.push(intermediates.contourSet);
      }

      if (intermediates.polyMesh) {
        polyMeshList.push(intermediates.polyMesh);
      }

      if (intermediates.polyMeshDetail) {
        polyMeshDetailList.push(intermediates.polyMeshDetail);
      }
    } else if (intermediates.type === 'tiled') {
      for (const tile of intermediates.tileIntermediates) {
        if (tile.heightfield) {
          heightfieldList.push(tile.heightfield);
        }

        if (tile.compactHeightfield) {
          compactHeightfieldList.push(tile.compactHeightfield);
        }

        if (tile.contourSet) {
          contourSetList.push(tile.contourSet);
        }

        if (tile.polyMesh) {
          polyMeshList.push(tile.polyMesh);
        }

        if (tile.polyMeshDetail) {
          polyMeshDetailList.push(tile.polyMeshDetail);
        }
      }
    } else if (intermediates.type === 'tilecache') {
      for (const tile of intermediates.tileIntermediates) {
        if (tile.heightfield) {
          heightfieldList.push(tile.heightfield);
        }

        if (tile.compactHeightfield) {
          compactHeightfieldList.push(tile.compactHeightfield);
        }
      }
    }
  }

  return {
    heightfieldList,
    compactHeightfieldList,
    contourSetList,
    polyMeshList,
    polyMeshDetailList,
  };
};

type DebugDrawerOptions =
  (typeof DebugDrawerOption)[keyof typeof DebugDrawerOption];

export const NavMeshDebugDrawer = ({
  enabled,
  navMesh,
  intermediates,
  option,
}: {
  enabled: boolean;
  navMesh: NavMesh | undefined;
  intermediates?:
    | SoloNavMeshGeneratorIntermediates
    | TiledNavMeshGeneratorIntermediates
    | TileCacheGeneratorIntermediates;
  option: DebugDrawerOptions;
}) => {
  const [debug, setDebug] = useState<DebugDrawer | undefined>();

  useEffect(() => {
    const debugDrawer = new DebugDrawer();

    setDebug(debugDrawer);

    return () => {
      setDebug(undefined);

      debugDrawer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!debug) return;

    debug.reset();

    if (!navMesh) return;

    const {
      heightfieldList,
      compactHeightfieldList,
      contourSetList,
      polyMeshList,
      polyMeshDetailList,
    } = getIntermediates(intermediates);

    if (option === DebugDrawerOption.HEIGHTFIELD_SOLID) {
      for (const heightfield of heightfieldList) {
        debug.drawHeightfieldSolid(heightfield);
      }
    } else if (option === DebugDrawerOption.HEIGHTFIELD_WALKABLE) {
      for (const heightfield of heightfieldList) {
        debug.drawHeightfieldWalkable(heightfield);
      }
    } else if (option === DebugDrawerOption.COMPACT_HEIGHTFIELD_SOLID) {
      for (const compactHeightfield of compactHeightfieldList) {
        debug.drawCompactHeightfieldSolid(compactHeightfield);
      }
    } else if (option === DebugDrawerOption.COMPACT_HEIGHTFIELD_REGIONS) {
      for (const compactHeightfield of compactHeightfieldList) {
        debug.drawCompactHeightfieldRegions(compactHeightfield);
      }
    } else if (option === DebugDrawerOption.COMPACT_HEIGHTFIELD_DISTANCE) {
      for (const compactHeightfield of compactHeightfieldList) {
        debug.drawCompactHeightfieldDistance(compactHeightfield);
      }
    } else if (option === DebugDrawerOption.RAW_CONTOURS) {
      for (const contourSet of contourSetList) {
        debug.drawRawContours(contourSet);
      }
    } else if (option === DebugDrawerOption.CONTOURS) {
      for (const contourSet of contourSetList) {
        debug.drawContours(contourSet);
      }
    } else if (option === DebugDrawerOption.POLY_MESH) {
      for (const polyMesh of polyMeshList) {
        debug.drawPolyMesh(polyMesh);
      }
    } else if (option === DebugDrawerOption.POLY_MESH_DETAIL) {
      for (const polyMeshDetail of polyMeshDetailList) {
        debug.drawPolyMeshDetail(polyMeshDetail);
      }
    } else if (option === DebugDrawerOption.NAVMESH) {
      debug.drawNavMesh(navMesh);
    } else if (option === DebugDrawerOption.NAVMESH_BV_TREE) {
      debug.drawNavMeshBVTree(navMesh);
    }
  }, [debug, intermediates, navMesh, option]);

  return enabled && debug && <primitive object={debug} />;
};
