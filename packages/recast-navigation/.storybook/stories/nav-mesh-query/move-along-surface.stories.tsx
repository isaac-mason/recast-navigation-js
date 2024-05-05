import { useFrame } from '@react-three/fiber';
import { NavMesh, NavMeshQuery } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import React, { useEffect, useRef, useState } from 'react';
import { Group, Mesh, Vector3 } from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators, htmlTunnel } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'NavMeshQuery / Move Along Surface',
  decorators,
  parameters,
};

const _targetCameraPosition = new Vector3();

export const MoveAlongSurface = () => {
  const [level, setLevel] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery>();

  const capsule = useRef<Group>(null!);

  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const keyControlMap = {
      w: 'forward',
      s: 'backward',
      a: 'left',
      d: 'right',
      ArrowUp: 'forward',
      ArrowDown: 'backward',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const control = keyControlMap[event.key];
      if (control) {
        controls.current[control] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const control = keyControlMap[event.key];
      if (control) {
        controls.current[control] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(({ camera }, delta) => {
    if (!capsule.current || !navMeshQuery) return;

    const { forward, backward, left, right } = controls.current;

    const velocity = new Vector3();

    if (forward) velocity.z -= 1;
    if (backward) velocity.z += 1;
    if (left) velocity.x -= 1;
    if (right) velocity.x += 1;

    velocity.normalize();

    velocity.multiplyScalar(1 - Math.pow(0.001, delta)).multiplyScalar(0.5);

    const { point, polyRef } = navMeshQuery.findClosestPoint({
      x: capsule.current.position.x,
      y: capsule.current.position.y,
      z: capsule.current.position.z,
    });

    const movementTarget = new Vector3().copy(point).clone().add(velocity);

    const { resultPosition } = navMeshQuery.moveAlongSurface(
      polyRef,
      point,
      movementTarget
    );

    const polyHeightResult = navMeshQuery.getPolyHeight(
      polyRef,
      resultPosition
    );

    capsule.current.position.set(
      resultPosition.x,
      polyHeightResult.success ? polyHeightResult.height : resultPosition.y,
      resultPosition.z
    );

    const targetCameraPosition = _targetCameraPosition.copy(
      capsule.current.position
    );

    targetCameraPosition.y += 10;
    targetCameraPosition.z += 10;

    camera.position.copy(targetCameraPosition);
    camera.lookAt(capsule.current.position);
  });

  useEffect(() => {
    if (!level) return;

    const meshes: Mesh[] = [];

    level.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const cellSize = 0.05;

    const walkableRadius = 0.3;
    const walkableHeight = 0.35;

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
      cs: cellSize,
      ch: 0.2,
      walkableHeight: Math.round(walkableHeight / cellSize),
      walkableRadius: Math.round(walkableRadius / cellSize),
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery(navMesh);

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);

    return () => {
      setNavMesh(undefined);
      setNavMeshQuery(undefined);

      navMeshQuery.destroy();
      navMesh.destroy();
    };
  }, [level]);

  return (
    <>
      <group ref={capsule} position={[-4.128, 0.266, 4.852]}>
        <mesh position-y={0.5}>
          <capsuleGeometry args={[0.2, 1, 32]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </group>

      <group ref={setLevel}>
        <NavTestEnvironment />
      </group>

      <Debug navMesh={navMesh} />

      <htmlTunnel.In>
        <div
          style={{
            position: 'absolute',
            top: 0,
            padding: '25px',
            userSelect: 'none',
            fontSize: '1.5em',
            fontFamily: 'monospace',
            fontWeight: 400,
            color: 'white',
          }}
        >
          use wasd or arrow keys to move
        </div>
      </htmlTunnel.In>
    </>
  );
};
