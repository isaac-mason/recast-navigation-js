import { Bounds, OrbitControls } from '@react-three/drei';
import { NavMesh } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh } from 'three';
import { Debug } from '../../common/debug';
import { DungeonEnvirionment } from '../../common/dungeon-environment';
import { decorators } from '../../decorators';

export default {
  title: 'NavMesh / Non Indexed Geometry',
  decorators,
};

export const NonIndexedGeometry = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        const clone = child.clone();
        clone.geometry = clone.geometry.clone().toNonIndexed();
        meshes.push(clone);
      }
    });

    const { navMesh } = threeToSoloNavMesh(meshes, {
      cs: 0.15,
      ch: 0.2,
      walkableRadius: 0.6,
      walkableClimb: 2.1,
      walkableSlopeAngle: 60,
    });

    setNavMesh(navMesh);

    return () => {
      setNavMesh(undefined);
    };
  }, [group]);

  return (
    <>
      <Bounds fit>
        <group ref={setGroup}>
          <DungeonEnvirionment />
        </group>
      </Bounds>

      <Debug navMesh={navMesh} />

      <OrbitControls makeDefault />
    </>
  );
};
