import { Bounds, OrbitControls } from '@react-three/drei';
import type { NavMesh } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import { useEffect, useState } from 'react';
import { BoxGeometry, type Group, Mesh } from 'three';
import { Debug } from '../../common/debug';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'NavMesh / Non Indexed Geometry',
  decorators,
  parameters,
};

const boxGeometry = new BoxGeometry(10, 10, 10);
const nonIndexedBoxGeometry = boxGeometry.clone().toNonIndexed();

export const NonIndexedGeometry = () => {
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
          <mesh position={[8, 0, 0]}>
            <primitive attach="geometry" object={boxGeometry} />
            <meshStandardMaterial color="#ccc" />
          </mesh>

          <mesh position={[-8, 0, 0]}>
            <primitive attach="geometry" object={nonIndexedBoxGeometry} />
            <meshStandardMaterial color="#ccc" />
          </mesh>
        </group>
      </Bounds>

      <Debug navMesh={navMesh} />

      <OrbitControls makeDefault />
    </>
  );
};
