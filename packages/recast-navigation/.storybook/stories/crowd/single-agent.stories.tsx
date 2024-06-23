import { OrbitControls } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  Crowd,
  CrowdAgent,
  NavMesh,
  NavMeshQuery,
} from '@recast-navigation/core';
import React, { useEffect, useRef, useState } from 'react';
import { threeToSoloNavMesh } from 'recast-navigation/three';
import { Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { AgentPath } from '../../common/agent-path';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators, htmlTunnel } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'Crowd / Crowd With Single Agent',
  decorators,
  parameters,
};

const agentMaterial = new MeshStandardMaterial({
  color: 'red',
});

const _navMeshOnPointerDownVector = new Vector3();

export const CrowdWithSingleAgent = () => {
  const agentTargetSpanRef = useRef<HTMLSpanElement>(null!);
  const agentNextTargetPathSpanRef = useRef<HTMLSpanElement>(null!);

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
    const cellHeight = 0.05;

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
      cs: cellSize,
      ch: cellHeight,
      walkableRadius: Math.ceil(0.3 / cellSize),
      borderSize: 5,
      // maxEdgeLen: 2,
      // walkableHeight: Math.floor(1 / cellHeight),
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery(navMesh);
    // navMeshQuery.defaultQueryHalfExtents = { x: 0.5, y: 0.1, z: 0.5 }

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
      navMeshQuery.destroy();
      crowd.destroy();
      navMesh.destroy();

      setNavMesh(undefined);
      setNavMeshQuery(undefined);
      setCrowd(undefined);
      setAgent(undefined);
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowd || !agent) return;

    const clampedDelta = Math.max(delta, 0.1);

    crowd.update(clampedDelta);

    const agentTarget = agent.target();
    const agentNextTargetPath = agent.nextTargetInPath();
    agentTargetSpanRef.current.innerText = `${agentTarget.x.toFixed(
      3
    )}, ${agentTarget.y.toFixed(3)}, ${agentTarget.z.toFixed(3)}`;
    agentNextTargetPathSpanRef.current.innerText = `${agentNextTargetPath.x.toFixed(
      3
    )}, ${agentNextTargetPath.y.toFixed(3)}, ${agentNextTargetPath.z.toFixed(
      3
    )}`;
  });

  const onPointerDown = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !navMeshQuery || !crowd || !agent) return;

    e.stopPropagation();

    const point = _navMeshOnPointerDownVector.copy(e.point);

    navMeshQuery.defaultQueryHalfExtents.x = 0.01;
    navMeshQuery.defaultQueryHalfExtents.z = 0.01;
    navMeshQuery.defaultQueryHalfExtents.y = 0.01;
    const { nearestPoint: target } = navMeshQuery.findNearestPoly(point);

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

      <htmlTunnel.In>
        <div
          style={{
            position: 'absolute',
            top: 0,
            padding: '25px',
            userSelect: 'none',
            fontFamily: 'monospace',
            fontWeight: 400,
            color: 'white',
          }}
        >
          <div>
            agent target: <span ref={agentTargetSpanRef}></span>
          </div>
          <div>
            agent next target in path:{' '}
            <span ref={agentNextTargetPathSpanRef}></span>
          </div>
        </div>
      </htmlTunnel.In>

      <OrbitControls makeDefault />
    </>
  );
};
