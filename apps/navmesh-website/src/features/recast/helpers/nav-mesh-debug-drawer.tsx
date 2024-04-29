import { useEffect, useMemo } from 'react';
import {
  NavMesh,
  RecastHeightfield,
  RecastPolyMesh,
  RecastPolyMeshDetail,
} from 'recast-navigation';
import {
  SoloNavMeshGeneratorIntermediates,
  TiledNavMeshGeneratorIntermediates,
  TileCacheGeneratorIntermediates,
} from 'recast-navigation/generators';
import { DebugDrawer } from 'recast-navigation/three';

export const DebugDrawerOption = {
  NAVMESH: 'navmesh',
  HEIGHTFIELD: 'heightfield',
  POLY_MESH: 'poly mesh',
  POLY_MESH_DETAIL: 'poly mesh detail',
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
  const debug = useMemo(() => {
    return new DebugDrawer();
  }, []);

  useEffect(() => {
    const onResize = () => {
      debug.resize(window.innerWidth, window.innerHeight);
    };

    onResize();

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    debug.reset();

    if (!navMesh) return;

    const heightfieldList: RecastHeightfield[] = [];
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

        if (intermediate.polyMesh) {
          polyMeshList.push(intermediate.polyMesh);
        }

        if (intermediate.polyMeshDetail) {
          polyMeshDetailList.push(intermediate.polyMeshDetail);
        }
      }
    }

    if (option === DebugDrawerOption.NAVMESH) {
      debug.drawNavMesh(navMesh, 0);
    } else if (option === DebugDrawerOption.HEIGHTFIELD) {
      for (const heightfield of heightfieldList) {
        debug.drawHeightfieldWalkable(heightfield);
      }
    } else if (option === DebugDrawerOption.POLY_MESH) {
      for (const polyMesh of polyMeshList) {
        debug.drawPolyMesh(polyMesh);
      }
    } else if (option === DebugDrawerOption.POLY_MESH_DETAIL) {
      for (const polyMeshDetail of polyMeshDetailList) {
        debug.drawPolyMeshDetail(polyMeshDetail);
      }
    }
  }, [navMesh, option]);

  return enabled && debug && <primitive object={debug} />;
};
