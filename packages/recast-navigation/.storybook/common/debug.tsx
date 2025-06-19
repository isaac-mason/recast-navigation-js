import { useFrame } from '@react-three/fiber';
import { Crowd, NavMesh, TileCache } from '@recast-navigation/core';
import {
  CrowdHelper,
  DebugDrawer,
  TileCacheHelper,
} from '@recast-navigation/three';
import React, { useEffect, useMemo } from 'react';
import { Material } from 'three';

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
      const color = (0) | (0 << 8) | (255 << 16) | (128 << 24);
      debugDrawer.drawNavMeshPolysWithFlags(navMesh, 1, color);
    };

    update();

    const interval = setInterval(() => {
      update();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [navMesh]);

  useEffect(() => {
    if (!tileCacheHelper || !autoUpdate) return;

    const interval = setInterval(() => {
      tileCacheHelper.update();
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [tileCacheHelper]);

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
