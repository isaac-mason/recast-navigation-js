import { useThree } from '@react-three/fiber';
import { NavMesh } from '@recast-navigation/core';
import React, { useEffect, useState } from 'react';
import { NavMeshHelper, threeToNavMeshArgs } from 'recast-navigation/three';
import { Group, MeshStandardMaterial } from 'three';
import { BasicEnvironment } from '../utils/basic-environment';
import { createLine } from '../utils/create-line';
import { decorators } from '../utils/decorators';

export default {
  title: 'Pathfinding',
  decorators,
};

export const Basic = () => {
  const scene = useThree((state) => state.scene);
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!group) return;

    const args = threeToNavMeshArgs(group);

    console.log(args);

    const navMesh = new NavMesh();
    navMesh.build(...args, {
      cs: 0.05,
      ch: 0.02,
    });

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial: new MeshStandardMaterial({
        color: 'orange',
        transparent: true,
        opacity: 0.5,
      }),
    });

    scene.add(navMeshHelper.navMesh);

    const from = { x: 3, y: 0, z: 3 };
    const to = { x: -3.5, y: 0, z: -3 };

    const path = navMesh.computePath(from, to);

    const line = createLine(path);

    scene.add(line);

    return () => {
      scene.remove(navMeshHelper.navMesh);
      scene.remove(line);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <BasicEnvironment />
      </group>
    </>
  );
};
