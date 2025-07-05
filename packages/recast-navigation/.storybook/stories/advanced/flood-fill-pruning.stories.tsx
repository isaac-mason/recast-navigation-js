import { OrbitControls } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { floodFillPruneNavMesh, NavMeshQuery } from '@recast-navigation/core';
import { DebugDrawer, threeToSoloNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Group, Mesh } from 'three';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators, htmlTunnel } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'Advanced / Flood Fill Pruning',
  decorators,
  parameters,
};

export const FloodFillPruning = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [debug, setDebug] = useState<DebugDrawer | undefined>();

  const [point, setPoint] = useState<THREE.Vector3>(
    new THREE.Vector3(0.8, 0.26, 3.3),
  );

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const agentRadius = 0.1;
    const cellSize = 0.05;

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
      cs: cellSize,
      ch: 0.2,
      walkableRadius: Math.ceil(agentRadius / cellSize),
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery(navMesh);

    const nearestPolyResult = navMeshQuery.findNearestPoly(point, {
      halfExtents: { x: 2, y: 2, z: 2 },
    });

    if (!nearestPolyResult.success) return;

    floodFillPruneNavMesh(navMesh, [nearestPolyResult.nearestRef]);

    /* debug draw */
    const debug = new DebugDrawer();

    debug.drawNavMeshPolysWithFlags(navMesh, 1, 0x0000ff);

    setDebug(debug);

    return () => {
      setDebug(undefined);

      debug.dispose();
      navMeshQuery.destroy();
      navMesh.destroy();
    };
  }, [group, point]);

  const onPointerDown = ({ point }: ThreeEvent<PointerEvent>) => {
    setPoint(new THREE.Vector3(point.x, point.y, point.z));
  };

  return (
    <>
      <group ref={setGroup} onPointerDown={onPointerDown}>
        <NavTestEnvironment />
      </group>

      {debug && <primitive object={debug} />}

      <OrbitControls makeDefault />

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
          click to set flood fill start point
        </div>
      </htmlTunnel.In>
    </>
  );
};
