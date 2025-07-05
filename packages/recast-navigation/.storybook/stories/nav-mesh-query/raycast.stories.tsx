import { Line, OrbitControls } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { type NavMesh, NavMeshQuery } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import { useEffect, useState } from 'react';
import { type Group, Mesh, Vector3 } from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators, htmlTunnel } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'NavMeshQuery / Raycast',
  decorators,
  parameters,
};

export const Raycast = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [start, setStart] = useState<Vector3>(new Vector3(-3, 0.26, 4.7));

  const [end, setEnd] = useState<Vector3>(new Vector3(0.8, 0.26, 3.3));

  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery>();

  const [raycastResult, setRaycastResult] = useState<{
    hit: boolean;
    hitPoint?: Vector3;
  }>();

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

    const navMeshQuery = new NavMeshQuery(navMesh);

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
    if (!navMeshQuery) return;

    const nearestStartPoly = navMeshQuery.findNearestPoly(start);

    const raycastResult = navMeshQuery.raycast(
      nearestStartPoly.nearestRef,
      start,
      end,
    );

    const hit = 0 < raycastResult.t && raycastResult.t < 1.0;

    if (!hit) {
      setRaycastResult({
        hit: false,
      });
    } else {
      const distanceToHitBorder =
        start.distanceTo(end) * (raycastResult?.t ?? 0);

      const direction = end.clone().sub(start).normalize();

      const hitPoint = start
        .clone()
        .add(direction.clone().multiplyScalar(distanceToHitBorder));

      setRaycastResult({
        hit: true,
        hitPoint,
      });
    }
  }, [navMeshQuery, start, end]);

  const setRaycastPoint = ({ point, button }: ThreeEvent<PointerEvent>) => {
    if (button === 0) {
      // left click
      setStart(new Vector3(point.x, point.y, point.z));
    } else if (button === 2) {
      // right click
      setEnd(new Vector3(point.x, point.y, point.z));
    }
  };

  return (
    <>
      <group ref={setGroup} onPointerDown={setRaycastPoint}>
        <NavTestEnvironment />
      </group>
      <group position={[0, 0.05, 0]}>
        <mesh position={start}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshBasicMaterial color="blue" />
        </mesh>

        <mesh position={end}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshBasicMaterial color="green" />
        </mesh>

        {raycastResult?.hitPoint ? (
          <>
            <mesh position={raycastResult.hitPoint.toArray()}>
              <sphereGeometry args={[0.1, 32, 32]} />
              <meshBasicMaterial color="orange" />
            </mesh>

            <Line
              points={[start.toArray(), raycastResult.hitPoint.toArray()]}
              color="orange"
              lineWidth={10}
            />
          </>
        ) : (
          <Line
            points={[start.toArray(), end.toArray()]}
            color="orange"
            lineWidth={10}
          />
        )}
      </group>

      <Debug navMesh={navMesh} />

      <OrbitControls />

      <htmlTunnel.In>
        <div
          style={{
            position: 'absolute',
            top: 0,
            color: 'white',
            padding: '25px',
            userSelect: 'none',
            fontSize: '1.5em',
            fontFamily: 'monospace',
            fontWeight: 400,
          }}
        >
          left click to set start point, right click to set end point
        </div>
      </htmlTunnel.In>
    </>
  );
};
