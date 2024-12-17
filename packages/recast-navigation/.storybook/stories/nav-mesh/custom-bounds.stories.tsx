import { OrbitControls } from '@react-three/drei';
import { NavMesh, NavMeshQuery } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Box3, Group, Mesh } from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'NavMesh / Custom Bounds',
  decorators,
  parameters,
};

const BOUNDS = new Box3();
BOUNDS.min.set(-3, -1, -5);
BOUNDS.max.set(9, 5, 3);

export const CustomBounds = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery | undefined>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const walkableRadiusWorld = 0.1;
    const cellSize = 0.05;

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
      cs: cellSize,
      ch: 0.2,
      walkableRadius: Math.ceil(walkableRadiusWorld / cellSize),
      bounds: [BOUNDS.min.toArray(), BOUNDS.max.toArray()],
    });

    if (!success) {
      return;
    }

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);

    return () => {
      navMesh.destroy();

      setNavMesh(undefined);
      setNavMeshQuery(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvironment />
      </group>

      <box3Helper args={[BOUNDS]} />

      <Debug navMesh={navMesh} />

      <OrbitControls makeDefault />
    </>
  );
};
