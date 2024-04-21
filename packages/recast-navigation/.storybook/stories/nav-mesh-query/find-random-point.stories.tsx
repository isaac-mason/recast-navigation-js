import { NavMesh, NavMeshQuery } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh, MeshBasicMaterial, Vector3Tuple } from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators, tunnelRat } from '../../decorators';
import { parameters } from '../../parameters';
import { OrbitControls } from '@react-three/drei';

export default {
  title: 'NavMeshQuery / Find Random Point',
  decorators,
  parameters,
};

const navMeshMaterial = new MeshBasicMaterial({
  wireframe: true,
  color: 'red',
});

export const FindRandomPoint = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery>();
  const [point, setPoint] = useState<Vector3Tuple>([0, 0, 0]);

  const newPoint = async function () {
    if (!navMeshQuery) return;

    const result = navMeshQuery.findRandomPoint();
    if (!result) return;

    const point = result.randomPoint;
    setPoint([point.x, point.y, point.z]);
  };

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

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);

    return () => {
      navMesh.destroy();
      navMeshQuery.destroy();

      setNavMesh(undefined);
      setNavMeshQuery(undefined);
    };
  }, [group]);

  useEffect(() => {
    newPoint();
  }, [navMeshQuery]);

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvironment />
      </group>

      {point && (
        <mesh position={point}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshBasicMaterial color="blue" />
        </mesh>
      )}

      <Debug navMesh={navMesh} navMeshMaterial={navMeshMaterial} />

      <OrbitControls makeDefault />

      <tunnelRat.In>
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            margin: '2em',
          }}
        >
          <button onClick={newPoint} style={{ padding: '0.5em' }}>
            New Random Point
          </button>
        </div>
      </tunnelRat.In>
    </>
  );
};
