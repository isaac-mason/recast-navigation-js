import { useEffect, useState } from 'react';
import {
  NavMesh,
  RecastCompactHeightfield,
  RecastContourSet,
  RecastHeightfield,
  RecastPolyMesh,
  RecastPolyMeshDetail,
} from 'recast-navigation';
import {
  SoloNavMeshGeneratorIntermediates,
  TileCacheGeneratorIntermediates,
  TiledNavMeshGeneratorIntermediates,
} from 'recast-navigation/generators';
import { DebugDrawer } from 'recast-navigation/three';

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

    const onResize = () => {
      debug.resize(window.innerWidth, window.innerHeight);
    };

    onResize();

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [debug]);

  useEffect(() => {
    if (!debug) return;

    debug.reset();

    if (!navMesh) return;

    const heightfieldList: RecastHeightfield[] = [];
    const compactHeightfieldList: RecastCompactHeightfield[] = [];
    const contourSetList: RecastContourSet[] = [];
    const polyMeshList: RecastPolyMesh[] = [];
    const polyMeshDetailList: RecastPolyMeshDetail[] = [];

    if (intermediates) {
      const intermediatesList = Array.isArray(intermediates)
        ? intermediates
        : [intermediates];

      for (const intermediate of intermediatesList) {
        if (intermediate.heightfield) {
          heightfieldList.push(intermediate.heightfield);
        }

        if (intermediate.compactHeightfield) {
          compactHeightfieldList.push(intermediate.compactHeightfield);
        }

        if (intermediate.contourSet) {
          contourSetList.push(intermediate.contourSet);
        }

        if (intermediate.polyMesh) {
          polyMeshList.push(intermediate.polyMesh);
        }

        if (intermediate.polyMeshDetail) {
          polyMeshDetailList.push(intermediate.polyMeshDetail);
        }
      }
    }

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
  }, [debug, navMesh, option]);

  return enabled && debug && <primitive object={debug} />;
};
