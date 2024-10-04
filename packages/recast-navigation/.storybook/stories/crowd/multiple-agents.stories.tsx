import { OrbitControls } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Crowd, NavMesh, NavMeshQuery } from '@recast-navigation/core';
import React, { useEffect, useState } from 'react';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'Crowd / Crowd With Multiple Agents',
  decorators,
  parameters,
};

const agentMaterial = new MeshStandardMaterial({
  color: 'red',
});

export const CrowdWithMultipleAgents = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery | undefined>();
  const [crowd, setCrowd] = useState<Crowd | undefined>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const maxAgentRadius = 0.15;
    const cellSize = 0.05;

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
      cs: cellSize,
      ch: 0.2,
      walkableRadius: Math.ceil(maxAgentRadius / cellSize),
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery(navMesh);

    const crowd = new Crowd(navMesh, {
      maxAgents: 10,
      maxAgentRadius,
    });

    for (let i = 0; i < 10; i++) {
      const { randomPoint: position } =
        navMeshQuery.findRandomPointAroundCircle({ x: -2, y: 0, z: 3 }, 1);

      crowd.addAgent(position, {
        radius: 0.1 + Math.random() * 0.05,
        height: 0.5,
        maxAcceleration: 4.0,
        maxSpeed: 1.0,
        separationWeight: 1.0,
      });
    }

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);
    setCrowd(crowd);

    return () => {
      navMeshQuery.destroy();
      crowd.destroy();
      navMesh.destroy();

      setNavMesh(undefined);
      setNavMeshQuery(undefined);
      setCrowd(undefined);
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowd) return;

    const clampedDelta = Math.min(delta, 0.1);

    crowd.update(clampedDelta);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !navMeshQuery || !crowd) return;

    const { point: target } = navMeshQuery.findClosestPoint(e.point);

    for (const agent of crowd.getAgents()) {
      agent.requestMoveTarget(target);
    }
  };

  return (
    <>
      <group ref={setGroup} onClick={onClick}>
        <NavTestEnvironment />
      </group>

      <Debug navMesh={navMesh} crowd={crowd} agentMaterial={agentMaterial} />

      <OrbitControls />
    </>
  );
};
