import { useThree } from '@react-three/fiber';
import React, { useEffect, useState } from 'react';
import { NavMeshHelper, threeToNavMesh } from 'recast-navigation/three';
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

    const navMesh = threeToNavMesh(group, {
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

    return () => {
      scene.remove(navMeshHelper.navMesh);
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
