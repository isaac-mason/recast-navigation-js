import { OrbitControls } from '@react-three/drei';
import { NavMesh, importNavMesh } from '@recast-navigation/core';
import { getPositionsAndIndices } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh } from 'three';
import { Debug } from '../../../common/debug';
import { NavTestEnvironment } from '../../../common/nav-test-environment';
import { decorators } from '../../../decorators';
import { parameters } from '../../../parameters';
import NavMeshWorker from './navmesh-worker?worker';

export default {
  title: 'Advanced / Web Worker',
  decorators,
  parameters,
};

export const WebWorker = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const [positions, indices] = getPositionsAndIndices(meshes);

    const config = {
      cs: 0.05,
      ch: 0.2,
    };

    const worker = new NavMeshWorker();

    worker.postMessage({ positions, indices, config }, [
      positions.buffer,
      indices.buffer,
    ]);

    let navMesh: NavMesh | undefined;

    worker.onmessage = (event) => {
      const navMeshExport = event.data;

      const result = importNavMesh(navMeshExport);

      navMesh = result.navMesh;
      setNavMesh(navMesh);
    };

    return () => {
      worker.terminate();

      if (navMesh) {
        navMesh.destroy();
      }

      setNavMesh(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvironment />
      </group>

      <Debug navMesh={navMesh} />

      <OrbitControls />
    </>
  );
};
