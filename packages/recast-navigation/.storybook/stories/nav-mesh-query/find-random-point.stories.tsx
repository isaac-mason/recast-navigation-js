import { type NavMesh, NavMeshQuery } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import { useCallback, useEffect, useState } from 'react';
import { type Group, Mesh, type Vector3Tuple } from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators, htmlTunnel } from '../../decorators';
import { parameters } from '../../parameters';
import { OrbitControls } from '@react-three/drei';
import { setRandomSeed } from '@recast-navigation/core';

export default {
  title: 'NavMeshQuery / Find Random Point',
  decorators,
  parameters,
};

export const FindRandomPoint = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery>();
  const [point, setPoint] = useState<Vector3Tuple>([0, 0, 0]);

  const newPoint = useCallback(async () => {
    if (!navMeshQuery) return;

    const result = navMeshQuery.findRandomPoint();
    if (!result) return;

    const point = result.randomPoint;
    setPoint([point.x, point.y, point.z]);
  }, [navMeshQuery]);

  useEffect(() => {
    if (!group) return;

    setRandomSeed(1337);

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

    const navMeshQuery = new NavMeshQuery(navMesh);

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);

    newPoint();

    return () => {
      setNavMesh(undefined);
      setNavMeshQuery(undefined);

      navMeshQuery.destroy();
      navMesh.destroy();
    };
  }, [group, newPoint]);

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

      <Debug navMesh={navMesh} />

      <OrbitControls makeDefault />

      <htmlTunnel.In>
        <div
          style={{
            position: 'absolute',
            top: 0,
            padding: '25px',
            userSelect: 'none',
          }}
        >
          <button
            type="button"
            onClick={newPoint}
            style={{
              padding: '0.5em',
              fontSize: '1em',
              fontFamily: 'monospace',
              fontWeight: 400,
            }}
          >
            New Random Point
          </button>
        </div>
      </htmlTunnel.In>
    </>
  );
};
