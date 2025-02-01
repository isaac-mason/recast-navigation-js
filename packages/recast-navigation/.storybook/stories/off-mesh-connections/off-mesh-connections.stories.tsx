import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  Crowd,
  NavMesh,
  NavMeshQuery,
  OffMeshConnectionParams,
} from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'Off Mesh Connections / Solo NavMesh Off Mesh Connections',
  decorators,
  parameters,
};

const agentMaterial = new MeshStandardMaterial({
  color: 'red',
});

const offMeshConnectionDefaults = {
  radius: 0.3,
  area: 0,
  flags: 1,
  bidirectional: false,
};

const offMeshConnections: OffMeshConnectionParams[] = [
  {
    ...offMeshConnectionDefaults,
    startPosition: {
      x: 4.501361846923828,
      y: 0.36645400524139404,
      z: 2.227370500564575,
    },
    endPosition: {
      x: 6.453944206237793,
      y: 0.4996081590652466,
      z: 1.6987327337265015,
    },
    bidirectional: true,
  },
  {
    ...offMeshConnectionDefaults,
    startPosition: {
      x: 0.2870096266269684,
      y: 3.9292590618133545,
      z: 2.564833402633667,
    },
    endPosition: {
      x: 1.4627689123153687,
      y: 2.778116226196289,
      z: 3.5469906330108643,
    },
  },
  {
    ...offMeshConnectionDefaults,
    startPosition: {
      x: 3.5109636783599854,
      y: 3.1664540767669678,
      z: 2.893442392349243,
    },
    endPosition: {
      x: 3.669801950454712,
      y: 0.36645400524139404,
      z: 2.135521173477173,
    },
  },
];

export const SoloNavMeshOffMeshConnections = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery>();
  const [crowd, setCrowd] = useState<Crowd>();

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
      offMeshConnections,
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery(navMesh);

    const crowd = new Crowd(navMesh, {
      maxAgents: 1,
      maxAgentRadius: 0.1,
    });

    const { point: agentPosition } = navMeshQuery.findClosestPoint({
      x: 0,
      y: 3.9,
      z: 2.5,
    });

    crowd.addAgent(agentPosition, {
      radius: 0.1,
      height: 0.5,
      maxSpeed: 2,
    });

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);
    setCrowd(crowd);

    return () => {
      setNavMesh(undefined);
      setNavMeshQuery(undefined);
      setCrowd(undefined);

      navMesh.destroy();
      navMeshQuery.destroy();
      crowd.destroy();
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowd) return;

    crowd.update(delta);
  });

  const onPointerDown = (e: ThreeEvent<MouseEvent>) => {
    if (!crowd || !navMeshQuery) return;
    const { x, y, z } = e.point;

    const agent = crowd.getAgent(0);
    if (!agent) return;

    const { point: nearest } = navMeshQuery.findClosestPoint({ x, y, z });

    agent.requestMoveTarget(nearest);
  };

  return (
    <>
      <group ref={setGroup} onPointerDown={onPointerDown}>
        <NavTestEnvironment />
      </group>

      <Debug navMesh={navMesh} crowd={crowd} agentMaterial={agentMaterial} />

      <PerspectiveCamera makeDefault position={[7, 10, 7]} fov={50} />
      <OrbitControls target={[3, 3, 3]} />
    </>
  );
};
