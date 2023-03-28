import { useThree } from '@react-three/fiber';
import { Crowd, NavMesh } from '@recast-navigation/core';
import React, { useEffect, useState } from 'react';
import { ThreeDebugNavMesh, threeToNavMeshArgs } from 'recast-navigation/three';
import { Group, MeshStandardMaterial } from 'three';
import { BasicEnvironment } from '../utils/basic-environment';
import { decorators } from '../utils/decorators';

export default {
  title: 'Crowd',
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

    const threeDebugNavMesh = new ThreeDebugNavMesh({
      navMesh,
      navMeshMaterial: new MeshStandardMaterial({
        color: 'orange',
        transparent: true,
        opacity: 0.5,
      }),
    });

    scene.add(threeDebugNavMesh.mesh);

    const crowd = new Crowd({
      navMesh,
      maxAgents: 5,
      maxAgentRadius: 0.5,
    });

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
