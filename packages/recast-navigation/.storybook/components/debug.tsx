import { useFrame } from '@react-three/fiber';
import { Crowd, NavMesh } from '@recast-navigation/core';
import { CrowdHelper, NavMeshHelper } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Material, MeshBasicMaterial, MeshStandardMaterial } from 'three';

export type DebugProps = {
  navMesh?: NavMesh;
  navMeshMaterial?: Material;
  obstacleMaterial?: Material;
  crowd?: Crowd;
  agentMaterial?: Material;
};

export const Debug = ({
  navMesh,
  navMeshMaterial,
  obstacleMaterial,
  crowd,
  agentMaterial,
}: DebugProps) => {
  const [navMeshHelper, setNavMeshHelper] = useState<NavMeshHelper | null>(
    null
  );

  const [crowdHelper, setCrowdHelper] = useState<CrowdHelper | null>(null);

  useEffect(() => {
    if (!navMesh) return;

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial:
        navMeshMaterial ??
        new MeshBasicMaterial({
          color: 'orange',
          transparent: true,
          opacity: 0.7,
        }),
      obstacleMaterial,
    });

    setNavMeshHelper(navMeshHelper);

    return () => {
      setNavMeshHelper(null);
    };
  }, [navMesh, navMeshMaterial, obstacleMaterial]);

  useEffect(() => {
    if (!crowd) return;

    const crowdHelper = new CrowdHelper({
      crowd,
      agentMaterial:
        agentMaterial ??
        new MeshStandardMaterial({
          color: 'red',
        }),
    });

    setCrowdHelper(crowdHelper);

    return () => {
      setCrowdHelper(null);
    };
  }, [crowd, agentMaterial]);

  useFrame(() => {
    if (crowdHelper) {
      crowdHelper.update();
    }
  });

  useEffect(() => {
    if (!navMeshHelper) return;

    const interval = setInterval(() => {
      navMeshHelper.updateObstacles();
      navMeshHelper.updateNavMesh();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [navMeshHelper]);

  return (
    <>
      {navMeshHelper && (
        <>
          <primitive object={navMeshHelper.navMesh} />
          <primitive object={navMeshHelper.obstacles} />
        </>
      )}

      {crowdHelper && <primitive object={crowdHelper.agents} />}
    </>
  );
};
