import { Crowd, NavMesh } from '@recast-navigation/core';
import { CrowdHelper, NavMeshHelper } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { MeshStandardMaterial } from 'three';

export type DebugProps = {
  navMesh?: NavMesh;
  navMeshMaterial?: MeshStandardMaterial;
  crowd?: Crowd;
};

export const Debug = ({ navMesh, navMeshMaterial, crowd }: DebugProps) => {
  const [navMeshHelper, setNavMeshHelper] = useState<NavMeshHelper | null>(
    null
  );

  const [crowdHelper, setCrowdHelper] = useState<CrowdHelper | null>(null);

  useEffect(() => {
    if (!navMesh) return;

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial: navMeshMaterial ?? new MeshStandardMaterial({
        color: 'orange',
        transparent: true,
        opacity: 0.8,
      }),
    });

    setNavMeshHelper(navMeshHelper);

    return () => {
      setNavMeshHelper(null);
    };
  }, [navMesh]);

  useEffect(() => {
    if (!crowd) return;

    const crowdHelper = new CrowdHelper({
      crowd,
      crowdMaterial: new MeshStandardMaterial({
        color: 'red',
      }),
    });

    setCrowdHelper(crowdHelper);

    return () => {
      setCrowdHelper(null);
    };
  }, [crowd]);

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
