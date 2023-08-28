import { Line, OrbitControls } from '@react-three/drei';
import { NavMesh, NavMeshQuery } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh, MeshBasicMaterial, Vector3Tuple } from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvirionment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';

export default {
  title: 'NavMeshQuery / ComputePath',
  decorators,
};

const navMeshMaterial = new MeshBasicMaterial({
  wireframe: true,
  color: 'red',
});

export const ComputePath = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [path, setPath] = useState<Vector3Tuple[]>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
      cs: 0.05,
      ch: 0.2,
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery({ navMesh });

    const path = navMeshQuery.computePath(
      navMeshQuery.getClosestPoint({
        x: -4.128927083678903,
        y: 0.2664172349988201,
        z: 4.8521110263641685,
      }),
      navMeshQuery.getClosestPoint({
        x: 2.0756323479723005,
        y: 2.38756142461898,
        z: -1.9437325288048717,
      })
    );

    setNavMesh(navMesh);
    setPath(path ? path.map((v) => [v.x, v.y, v.z]) : undefined);

    return () => {
      navMesh.destroy();
      navMeshQuery.destroy();

      setNavMesh(undefined);
      setPath(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvirionment />
      </group>

      {path && <Line points={path} color={'orange'} lineWidth={10} />}

      <Debug navMesh={navMesh} navMeshMaterial={navMeshMaterial} />

      <OrbitControls />
    </>
  );
};
