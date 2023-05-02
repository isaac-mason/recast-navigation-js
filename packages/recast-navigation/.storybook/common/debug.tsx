import { useFrame } from '@react-three/fiber';
import { Crowd, NavMesh, TileCache } from '@recast-navigation/core';
import {
  CrowdHelper,
  NavMeshHelper,
  TileCacheHelper,
} from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Material, MeshBasicMaterial, MeshStandardMaterial } from 'three';

export type DebugProps = {
  navMesh?: NavMesh;
  navMeshMaterial?: Material;
  tileCache?: TileCache;
  obstacleMaterial?: Material;
  crowd?: Crowd;
  agentMaterial?: Material;
};

export const Debug = ({
  navMesh,
  navMeshMaterial,
  tileCache,
  obstacleMaterial,
  crowd,
  agentMaterial,
}: DebugProps) => {
  const [navMeshHelper, setNavMeshHelper] = useState<NavMeshHelper | null>(
    null
  );

  const [tileCacheHelper, setTileCacheHelper] =
    useState<TileCacheHelper | null>();

  const [crowdHelper, setCrowdHelper] = useState<CrowdHelper | null>(null);

  useEffect(() => {
    if (!navMesh) return;

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial,
    });

    setNavMeshHelper(navMeshHelper);

    return () => {
      setNavMeshHelper(null);
    };
  }, [navMesh, navMeshMaterial]);

  useEffect(() => {
    if (!tileCache) return;

    const tileCacheHelper = new TileCacheHelper({
      tileCache,
      obstacleMaterial,
    });

    setTileCacheHelper(tileCacheHelper);

    return () => {
      setTileCacheHelper(null);
    };
  }, [tileCache, obstacleMaterial]);

  useEffect(() => {
    if (!crowd) return;

    const crowdHelper = new CrowdHelper({
      crowd,
      agentMaterial,
    });

    setCrowdHelper(crowdHelper);

    return () => {
      setCrowdHelper(null);
    };
  }, [crowd, agentMaterial]);

  useFrame(() => {
    if (crowdHelper) {
      crowdHelper.updateAgents();
    }
  });

  useEffect(() => {
    if (!navMeshHelper) return;

    const interval = setInterval(() => {
      navMeshHelper.updateNavMesh();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [navMeshHelper]);

  useEffect(() => {
    if (!tileCacheHelper) return;

    const interval = setInterval(() => {
      tileCacheHelper.updateObstacles();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [tileCacheHelper]);

  return (
    <>
      {navMeshHelper && <primitive object={navMeshHelper.navMesh} />}

      <group position={[0, 0.01, 0]}>
        {tileCacheHelper && <primitive object={tileCacheHelper.obstacles} />}
      </group>

      {crowdHelper && <primitive object={crowdHelper.agents} />}
    </>
  );
};
