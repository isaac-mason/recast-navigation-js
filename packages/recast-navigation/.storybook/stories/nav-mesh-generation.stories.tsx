import { OrbitControls } from '@react-three/drei';
import { NavMesh } from '@recast-navigation/core';
import { threeToNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh } from 'three';
import { BasicEnvironment } from '../components/basic-environment';
import { Debug } from '../components/debug';
import { decorators } from '../decorators';

export default {
  title: 'NavMeshGeneration',
  decorators,
};

export const NavMeshGeneration = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const navMesh = threeToNavMesh(meshes, {
      cs: 0.05,
      ch: 0.05,
    });

    setNavMesh(navMesh);

    return () => {
      setNavMesh(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <BasicEnvironment />
      </group>

      <Debug navMesh={navMesh} />

      <OrbitControls />
    </>
  );
};
