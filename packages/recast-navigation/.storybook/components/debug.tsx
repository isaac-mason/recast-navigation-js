import { useFrame } from '@react-three/fiber';
import { Crowd, NavMesh } from '@recast-navigation/core';
import { CrowdHelper, NavMeshHelper } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Material, MeshBasicMaterial, MeshStandardMaterial } from 'three';

export type DebugProps = {
  navMesh?: NavMesh;
  navMeshMaterial?: Material;
  obstaclesMaterial?: Material;
  crowd?: Crowd;
  crowdMaterial?: Material;
};

export const Debug = ({
  navMesh,
  navMeshMaterial,
  obstaclesMaterial,
  crowd,
  crowdMaterial,
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
      obstaclesMaterial: obstaclesMaterial,
    });

    setNavMeshHelper(navMeshHelper);

    return () => {
      setNavMeshHelper(null);
    };
  }, [navMesh, navMeshMaterial, obstaclesMaterial]);

  useEffect(() => {
    if (!crowd) return;

    const crowdHelper = new CrowdHelper({
      crowd,
      crowdMaterial:
        crowdMaterial ??
        new MeshStandardMaterial({
          color: 'red',
        }),
    });

    setCrowdHelper(crowdHelper);

    return () => {
      setCrowdHelper(null);
    };
  }, [crowd, crowdMaterial]);

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
