import { OrbitControls } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  Crowd,
  CrowdAgent,
  NavMesh,
  NavMeshQuery,
} from '@recast-navigation/core';
import React, { useEffect, useState } from 'react';
import { threeToSoloNavMesh } from 'recast-navigation/three';
import { Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { AgentPath } from '../../common/agent-path';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'Crowd / Crowd With Single Agent',
  decorators,
  parameters,
};

const agentMaterial = new MeshStandardMaterial({
  color: 'red',
});

export const CrowdWithSingleAgent = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery | undefined>();
  const [crowd, setCrowd] = useState<Crowd | undefined>();
  const [agent, setAgent] = useState<CrowdAgent | undefined>();

  const [agentTarget, setAgentTarget] = useState<Vector3 | undefined>();

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

    const crowd = new Crowd(navMesh, { maxAgents: 1, maxAgentRadius: 0.2 });

    const { point: agentPosition } = navMeshQuery.findClosestPoint({
      x: -2.9,
      y: 2.366,
      z: 0.9,
    });

    const agent = crowd.addAgent(agentPosition, {
      radius: agentRadius,
      height: 0.5,
      maxAcceleration: 4.0,
      maxSpeed: 1.0,
      collisionQueryRange: 0.5,
      pathOptimizationRange: 0.0,
    });

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);
    setCrowd(crowd);
    setAgent(agent);

    return () => {
      navMesh.destroy();
      navMeshQuery.destroy();
      crowd.destroy();

      setNavMesh(undefined);
      setNavMeshQuery(undefined);
      setCrowd(undefined);
      setAgent(undefined);
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowd) return;

    crowd.update(delta);
  });

  const onPointerDown = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !navMeshQuery || !crowd || !agent) return;

    e.stopPropagation();

    const { point: target } = navMeshQuery.findClosestPoint(e.point);

    if (e.button === 2) {
      agent.teleport(target);

      setAgentTarget(undefined);
    } else {
      agent.requestMoveTarget(target);

      setAgentTarget(new Vector3().copy(target as Vector3));
    }
  };

  return (
    <>
      <AgentPath agent={agent} target={agentTarget} />

      <group onPointerDown={onPointerDown}>
        <group ref={setGroup}>
          <NavTestEnvironment />
        </group>

        <Debug navMesh={navMesh} crowd={crowd} agentMaterial={agentMaterial} />
      </group>

      <OrbitControls makeDefault />
    </>
  );
};
