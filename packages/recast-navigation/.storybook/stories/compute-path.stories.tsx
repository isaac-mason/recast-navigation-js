import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { NavMesh } from '@recast-navigation/core';
import { threeToNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh } from 'three';
import { ComplexEnvironment } from '../components/complex-environment';
import { Debug } from '../components/debug';
import { decorators } from '../decorators';
import { createLineMesh } from '../utils/create-line-mesh';

export default {
  title: 'ComputePath',
  decorators,
};

export const ComputePath = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [pathLineMesh, setPathLineMesh] = useState<Mesh | undefined>();

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
      ch: 0.2,
      walkableHeight: 1,
      walkableClimb: 2.5,
      walkableRadius: 1,
      borderSize: 0.2,
    });

    navMesh.update()

    const from = navMesh.getClosestPoint({
      x: 0.5,
      y: 0.26,
      z: 4.9,
    });

    const to = navMesh.getClosestPoint({
      x: -0.14,
      y: 3.8,
      z: 2.7,
    });

    const path = navMesh.computePath(from, to);
    console.log(path);

    const pathMesh = createLineMesh(path);

    setNavMesh(navMesh);
    setPathLineMesh(pathMesh);

    return () => {
      setNavMesh(undefined);
      setPathLineMesh(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <ComplexEnvironment />
      </group>

      {pathLineMesh && (
        <group position={[0, 0.2, 0]}>
          <primitive object={pathLineMesh} />
        </group>
      )}

      <Debug navMesh={navMesh} />

      <OrbitControls />

      <PerspectiveCamera makeDefault position={[-10, 15, 10]} />
    </>
  );
};
