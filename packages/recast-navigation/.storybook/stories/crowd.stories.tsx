import { OrbitControls } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Crowd, NavMesh, NavMeshQuery } from '@recast-navigation/core';
import React, { useEffect, useState } from 'react';
import { threeToNavMesh } from 'recast-navigation/three';
import { Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { Debug } from '../common/debug';
import { NavTestEnvirionment } from '../common/nav-test-environment';
import { decorators } from '../decorators';
import { createLineMesh } from '../utils/create-line-mesh';

export default {
  title: 'Crowd / Agents',
  decorators,
};

const agentMaterial = new MeshStandardMaterial({
  color: 'red',
});

export const SingleAgent = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery | undefined>();
  const [crowd, setCrowd] = useState<Crowd | undefined>();

  const [agentTarget, setAgentTarget] = useState<Vector3 | undefined>();
  const [agentPathMesh, setAgentPathMesh] = useState<Mesh | undefined>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const { navMesh } = threeToNavMesh(meshes, {
      cs: 0.15,
      ch: 0.2,
      walkableRadius: 0.6,
      walkableClimb: 2.1,
      walkableSlopeAngle: 45,
    });

    const navMeshQuery = new NavMeshQuery({ navMesh });

    const crowd = new Crowd({ navMesh, maxAgents: 1, maxAgentRadius: 0.2 });

    crowd.addAgent(
      navMeshQuery.getClosestPoint({ x: -2.9, y: 2.366, z: 0.9 }),
      {
        radius: 0.1,
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

    return () => {
      setNavMesh(undefined);
      setNavMeshQuery(undefined);
      setCrowd(undefined);
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowd) return;

    crowd.update(delta);
  });

  useEffect(() => {
    if (!crowd) return;

    const interval = setInterval(() => {
      if (!crowd) return;

      if (!agentTarget) {
        setAgentPathMesh(undefined);
        return;
      }

      const path = [crowd.getAgentPosition(0), ...crowd.getAgentCorners(0)];

      if (path.length) {
        setAgentPathMesh(createLineMesh(path));
      } else {
        setAgentPathMesh(undefined);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [crowd, agentTarget]);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !navMeshQuery || !crowd) return;

    e.stopPropagation();

    const target = navMeshQuery.getClosestPoint(e.point);

    if (e.button === 2) {
      crowd.teleport(0, target);

      setAgentTarget(undefined);
    } else {
      crowd.goto(0, target);

      setAgentTarget(new Vector3().copy(target as Vector3));
    }
  };

  return (
    <>
      {agentPathMesh && (
        <group position={[0, 0.2, 0]}>
          <primitive object={agentPathMesh} />
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

    const { navMesh } = threeToNavMesh(meshes, {
      cs: 0.15,
      ch: 0.2,
      walkableRadius: 0.6,
      walkableClimb: 2.1,
      walkableSlopeAngle: 45,
    });

    const navMeshQuery = new NavMeshQuery({ navMesh });

    const crowd = new Crowd({
      navMesh,
      maxAgents: 10,
      maxAgentRadius: 0.15,
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
      crowd.goto(agent, target);
    }
  };

  return (
    <>
      <group onClick={onClick}>
        <group ref={setGroup}>
          <NavTestEnvirionment />
        </group>
      </group>

      <Debug navMesh={navMesh} crowd={crowd} agentMaterial={agentMaterial} />

      <OrbitControls />
    </>
  );
};
