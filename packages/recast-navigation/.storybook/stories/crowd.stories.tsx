import { Line, OrbitControls } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  Crowd,
  CrowdAgent,
  NavMesh,
  NavMeshQuery,
} from '@recast-navigation/core';
import React, { useEffect, useState } from 'react';
import { threeToSoloNavMesh } from 'recast-navigation/three';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  Vector3Tuple,
} from 'three';
import { Debug } from '../common/debug';
import { NavTestEnvirionment } from '../common/nav-test-environment';
import { decorators } from '../decorators';
import { parameters } from '../parameters';

export default {
  title: 'Crowd / Agents',
  decorators,
  parameters,
};

const agentMaterial = new MeshStandardMaterial({
  color: 'red',
});

export const SingleAgent = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery | undefined>();
  const [crowd, setCrowd] = useState<Crowd | undefined>();
  const [agent, setAgent] = useState<CrowdAgent | undefined>();

  const [agentTarget, setAgentTarget] = useState<Vector3 | undefined>();
  const [agentPath, setAgentPath] = useState<Vector3Tuple[] | undefined>();

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

    const navMeshQuery = new NavMeshQuery({ navMesh });

    const crowd = new Crowd({ navMesh, maxAgents: 1, maxAgentRadius: 0.2 });

    const agent = crowd.addAgent(
      navMeshQuery.getClosestPoint({ x: -2.9, y: 2.366, z: 0.9 }),
      {
        radius: agentRadius,
        height: 0.5,
        maxAcceleration: 4.0,
        maxSpeed: 1.0,
        collisionQueryRange: 0.5,
        pathOptimizationRange: 0.0,
      }
    );

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

  useEffect(() => {
    if (!crowd || !agent) return;

    if (!agentTarget) {
      setAgentPath(undefined);
      return;
    }

    const interval = setInterval(() => {
      const path = [agent.position(), ...agent.corners()];

      if (path.length) {
        setAgentPath(path.map((p) => [p.x, p.y + 0.1, p.z]));
      } else {
        setAgentPath(undefined);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [crowd, agentTarget]);

  useFrame((_, delta) => {
    if (!crowd) return;

    crowd.update(delta);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !navMeshQuery || !crowd || !agent) return;

    e.stopPropagation();

    const target = navMeshQuery.getClosestPoint(e.point);

    if (e.button === 2) {
      agent.teleport(target);

      setAgentTarget(undefined);
    } else {
      agent.goto(target);

      setAgentTarget(new Vector3().copy(target as Vector3));
    }
  };

  return (
    <>
      {agentPath && (
        <group position={[0, 0.2, 0]}>
          <primitive object={agentPath} />
        </group>
      )}

      {agentTarget && (
        <group position={[0, 0, 0]}>
          <mesh position={agentTarget}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        </group>
      )}

      <group onPointerDown={onClick}>
        <group ref={setGroup}>
          <NavTestEnvirionment />
        </group>
        <Debug navMesh={navMesh} crowd={crowd} agentMaterial={agentMaterial} />
      </group>

      {agentPath && <Line points={agentPath} color="blue" lineWidth={10} />}

      <OrbitControls makeDefault />
    </>
  );
};

export const MultipleAgents = () => {
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

    const navMeshQuery = new NavMeshQuery({ navMesh });

    const crowd = new Crowd({
      navMesh,
      maxAgents: 10,
      maxAgentRadius,
    });

    for (let i = 0; i < 10; i++) {
      crowd.addAgent(
        navMeshQuery.getRandomPointAround({ x: -2, y: 0, z: 3 }, 1),
        {
          radius: 0.1 + Math.random() * 0.05,
          height: 0.5,
          maxAcceleration: 4.0,
          maxSpeed: 1.0,
          separationWeight: 1.0,
        }
      );
    }

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);
    setCrowd(crowd);

    return () => {
      crowd.destroy();
      navMesh.destroy();

      setNavMesh(undefined);
      setNavMeshQuery(undefined);
      setCrowd(undefined);
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowd) return;

    crowd.update(delta);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !navMeshQuery || !crowd) return;

    const target = navMeshQuery.getClosestPoint(e.point);

    for (const agent of crowd.getAgents()) {
      agent.goto(target);
    }
  };

  return (
    <>
      <group ref={setGroup} onClick={onClick}>
        <NavTestEnvirionment />
      </group>

      <Debug navMesh={navMesh} crowd={crowd} agentMaterial={agentMaterial} />

      <OrbitControls />
    </>
  );
};
