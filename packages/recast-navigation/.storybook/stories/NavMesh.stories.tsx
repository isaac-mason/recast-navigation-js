import { useThree } from '@react-three/fiber';
import { init, NavMesh } from '@recast-navigation/core';
import React, { useEffect, useState } from 'react';
import { ThreeDebugNavMesh, threeToNavMeshArgs } from 'recast-navigation/three';
import { suspend } from 'suspend-react';
import { Group } from 'three';
import { Setup } from './Setup';

export default {
  title: 'NavMesh',
  decorators: [
    (Story: () => JSX.Element) => {
      suspend(() => init(), []);

      return <Story />;
    },
    (Story: () => JSX.Element) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
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
      cs: 0.1,
      ch: 0.1,
    });

    const threeDebugNavMesh = new ThreeDebugNavMesh({
      navMesh,
    });

    scene.add(threeDebugNavMesh.mesh);

    return () => {
      scene.remove(threeDebugNavMesh.mesh);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <mesh position-y={-0.25}>
          <boxGeometry args={[10, 0.5, 10]} />
          <meshStandardMaterial color="grey" />
        </mesh>

        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="white" />
        </mesh>

        <mesh position={[1.5, 0.5, 2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="white" />
        </mesh>

        <mesh position={[-2, 0.5, -1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="white" />
        </mesh>

        <mesh position={[2, 0.5, -0.5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>
    </>
  );
};
