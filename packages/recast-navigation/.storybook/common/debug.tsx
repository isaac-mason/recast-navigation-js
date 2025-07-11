import { useFrame } from '@react-three/fiber';
import { rgbToDuRgba, type Crowd, type NavMesh, type TileCache } from '@recast-navigation/core';
import {
  CrowdHelper,
  DebugDrawer,
  TileCacheHelper,
} from '@recast-navigation/three';
import { useEffect, useMemo } from 'react';
import type { Material } from 'three';

export type DebugProps = {
  autoUpdate?: boolean;
  navMesh?: NavMesh;
  tileCache?: TileCache;
  obstacleMaterial?: Material;
  crowd?: Crowd;
  agentMaterial?: Material;
};

export const Debug = ({
  autoUpdate,
  navMesh,
  tileCache,
  obstacleMaterial,
  crowd,
  agentMaterial,
}: DebugProps) => {
  const debugDrawer = useMemo(() => {
    return new DebugDrawer();
  }, []);

  const tileCacheHelper = useMemo(() => {
    if (!tileCache) return null;

    return new TileCacheHelper(tileCache, {
      obstacleMaterial,
    });
  }, [tileCache, obstacleMaterial]);

  const crowdHelper = useMemo(() => {
    if (!crowd) return null;

    return new CrowdHelper(crowd, {
      agentMaterial,
    });
  }, [crowd, agentMaterial]);

  useFrame(() => {
    if (crowdHelper) {
      crowdHelper.update();
    }
  });

  useEffect(() => {
    if (!navMesh) return;

    const update = () => {
      debugDrawer.clear();
      debugDrawer.drawNavMeshPolysWithFlags(navMesh, 1, rgbToDuRgba(0x0000ff));
    };

    update();

    const interval = setInterval(() => {
      update();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [debugDrawer, navMesh]);

  useEffect(() => {
    if (!tileCacheHelper || !autoUpdate) return;

    const interval = setInterval(() => {
      tileCacheHelper.update();
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [tileCacheHelper, autoUpdate]);

  return (
    <>
      {debugDrawer && <primitive object={debugDrawer} />}

      <group position={[0, 0.01, 0]}>
        {tileCacheHelper && <primitive object={tileCacheHelper} />}
      </group>

      {crowdHelper && <primitive object={crowdHelper} />}
    </>
  );
};
