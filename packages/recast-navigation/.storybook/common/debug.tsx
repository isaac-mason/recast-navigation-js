import { useFrame } from '@react-three/fiber';
import {
  Crowd,
  NavMesh,
  OffMeshConnection,
  TileCache,
} from '@recast-navigation/core';
import {
  CrowdHelper,
  NavMeshHelper,
  TileCacheHelper,
} from '@recast-navigation/three';
import { OffMeshConnectionsHelper } from '@recast-navigation/three/src/helpers/off-mesh-connections-helper';
import React, { useEffect, useMemo, useState } from 'react';
import { Material } from 'three';

export type DebugProps = {
  navMesh?: NavMesh;
  navMeshMaterial?: Material;
  tileCache?: TileCache;
  obstacleMaterial?: Material;
  crowd?: Crowd;
  agentMaterial?: Material;
  offMeshConnections?: OffMeshConnection[];
};

export const Debug = ({
  navMesh,
  navMeshMaterial,
  tileCache,
  obstacleMaterial,
  crowd,
  agentMaterial,
  offMeshConnections,
}: DebugProps) => {
  const navMeshHelper = useMemo(() => {
    if (!navMesh) return null;

    return new NavMeshHelper({
      navMesh,
      navMeshMaterial,
    });
  }, [navMesh, navMeshMaterial]);

  const tileCacheHelper = useMemo(() => {
    if (!tileCache) return null;

    return new TileCacheHelper({
      tileCache,
      obstacleMaterial,
    });
  }, [tileCache, obstacleMaterial]);

  const crowdHelper = useMemo(() => {
    if (!crowd) return null;

    return new CrowdHelper({
      crowd,
      agentMaterial,
    });
  }, [crowd, agentMaterial]);

  const offMeshConnectionsHelper = useMemo(() => {
    if (!offMeshConnections) return null;

    return new OffMeshConnectionsHelper({
      offMeshConnections,
    });
  }, [offMeshConnections]);

  useFrame(() => {
    if (crowdHelper) {
      crowdHelper.update();
    }
  });

  useEffect(() => {
    if (!navMeshHelper) return;

    const interval = setInterval(() => {
      navMeshHelper.update();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [navMeshHelper]);

  useEffect(() => {
    if (!tileCacheHelper) return;

    const interval = setInterval(() => {
      tileCacheHelper.update();
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [tileCacheHelper]);

  return (
    <>
      {navMeshHelper && <primitive object={navMeshHelper} />}

      <group position={[0, 0.01, 0]}>
        {tileCacheHelper && <primitive object={tileCacheHelper} />}
      </group>

      {crowdHelper && <primitive object={crowdHelper} />}

      {offMeshConnectionsHelper && (
        <primitive object={offMeshConnectionsHelper} />
      )}
    </>
  );
};
