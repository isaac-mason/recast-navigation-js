import { OrbitControls } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Crowd, NavMesh } from '@recast-navigation/core';
import React, { useEffect, useState } from 'react';
import { threeToNavMesh } from 'recast-navigation/three';
import { Group, Mesh, MeshBasicMaterial } from 'three';
import { Debug } from '../components/debug';
import { decorators } from '../decorators';

export default {
  title: 'Obstacles',
  decorators,
};

const navMeshMaterial = new MeshBasicMaterial({
  color: 'blue',
  wireframe: true,
});

const obstaclesMaterial = new MeshBasicMaterial({
  color: 'red',
  wireframe: true,
});

export const Obstacles = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [crowd, setCrowd] = useState<Crowd | undefined>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const navMesh = threeToNavMesh(meshes, {
      ch: 0.2,
      cs: 0.2,
      tileSize: 8,
    });

    navMesh.addBoxObstacle(
      { x: -1.5, y: 0, z: 1.5 },
      { x: 1, y: 1, z: 1 },
      0.2
    );

    navMesh.addCylinderObstacle({ x: 1.5, y: 0, z: -1.5 }, 1, 0.5);

    navMesh.update();

    const crowd = new Crowd({
      navMesh,
      maxAgents: 1,
      maxAgentRadius: 0.2,
    });

    crowd.addAgent(navMesh.getClosestPoint({ x: 0, y: 0, z: 0 }), {
      radius: 0.2,
      height: 1,
      maxAcceleration: 4.0,
      maxSpeed: 1.0,
      collisionQueryRange: 0.5,
      pathOptimizationRange: 0.0,
      separationWeight: 1.0,
    });

    setNavMesh(navMesh);
    setCrowd(crowd);

    return () => {
      setNavMesh(undefined);
      setCrowd(undefined);

      crowd.destroy();
      navMesh.destroy();
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowd) return;

    crowd.update(delta);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !crowd) return;

    const target = navMesh.getClosestPoint(e.point);

    crowd.goto(0, target);
  };

  return (
    <>
      <group onClick={onClick}>
        <group ref={setGroup}>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#ccc" />
          </mesh>
        </group>
      </group>

      <Debug
        navMesh={navMesh}
        navMeshMaterial={navMeshMaterial}
        obstaclesMaterial={obstaclesMaterial}
        crowd={crowd}
      />

      <OrbitControls />
    </>
  );
};
