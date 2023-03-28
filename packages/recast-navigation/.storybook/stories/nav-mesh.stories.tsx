import { useThree } from '@react-three/fiber';
import React, { useEffect, useState } from 'react';
import { ThreeDebugNavMesh, threeToNavMesh } from 'recast-navigation/three';
import { Group, MeshStandardMaterial } from 'three';
import { BasicEnvironment } from '../utils/basic-environment';
import { decorators } from '../utils/decorators';

export default {
  title: 'NavMesh',
  decorators,
};

export const Basic = () => {
  const scene = useThree((state) => state.scene);
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!group) return;

    const navMesh = threeToNavMesh(group);

    const threeDebugNavMesh = new ThreeDebugNavMesh({
      navMesh,
      navMeshMaterial: new MeshStandardMaterial({
        color: 'orange',
        transparent: true,
        opacity: 0.5,
      }),
    });

    scene.add(threeDebugNavMesh.mesh);

    return () => {
      scene.remove(threeDebugNavMesh.mesh);
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
