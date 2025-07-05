import { OrbitControls, PivotControls } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  BoxObstacle,
  Crowd,
  CrowdAgent,
  CylinderObstacle,
  NavMesh,
  NavMeshQuery,
  TileCache,
} from '@recast-navigation/core';
import { threeToTileCache } from '@recast-navigation/three';
import { useControls } from 'leva';
import React, { useEffect, useRef, useState } from 'react';
import { Group, Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';
import { Debug } from '../../common/debug';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'TileCache / Crowd Obstacles',
  decorators,
  parameters,
};

const obstaclesMaterial = new MeshBasicMaterial({
  color: 'red',
  wireframe: true,
});

export const CrowdObstacles = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery | undefined>();
  const [tileCache, setTileCache] = useState<TileCache | undefined>();
  const [crowd, setCrowd] = useState<Crowd | undefined>();
  const [agent, setAgent] = useState<CrowdAgent | undefined>();

  const boxObstacle = useRef<BoxObstacle | undefined>();
  const cylinderObstacle = useRef<CylinderObstacle | undefined>();

  const boxObstacleTarget = useRef<Object3D | null>(null!);
  const cylinderObstacleTarget = useRef<Object3D | null>(null!);

  const { agentMaxAcceleration, agentMaxSpeed } = useControls({
    agentMaxAcceleration: {
      value: 8,
      step: 1,
      min: 0.5,
      max: 20,
    },
    agentMaxSpeed: {
      value: 2,
      step: 1,
      min: 0.5,
      max: 10,
    },
  });

  useEffect(() => {
    if (!agent) return;

    agent.maxSpeed = agentMaxSpeed;
    agent.maxAcceleration = agentMaxAcceleration;
  }, [agent, agentMaxSpeed, agentMaxAcceleration]);

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const { success, navMesh, tileCache } = threeToTileCache(meshes, {
      ch: 0.05,
      cs: 0.1,
      tileSize: 32,
    });

    if (!success) return;

    let upToDate = false;
    while (!upToDate) {
      const result = tileCache.update(navMesh);
      upToDate = result.upToDate;
    }

    const navMeshQuery = new NavMeshQuery(navMesh);

    const crowd = new Crowd(navMesh, {
      maxAgents: 1,
      maxAgentRadius: 0.2,
    });

    const { point: agentPosition } = navMeshQuery.findClosestPoint({
      x: 0,
      y: 0,
      z: 0,
    });

    const agent = crowd.addAgent(agentPosition, {
      radius: 0.2,
      height: 1,
      maxAcceleration: agentMaxAcceleration,
      maxSpeed: agentMaxSpeed,
      collisionQueryRange: 0.5,
      pathOptimizationRange: 0.0,
      separationWeight: 1.0,
    });

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);
    setTileCache(tileCache);
    setCrowd(crowd);
    setAgent(agent);

    return () => {
      setNavMesh(undefined);
      setNavMeshQuery(undefined);
      setTileCache(undefined);
      setAgent(undefined);
      setCrowd(undefined);

      navMeshQuery.destroy();
      crowd.destroy();
      navMesh.destroy();
      tileCache.destroy();
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowd || !navMesh || !tileCache) return;

    if (boxObstacle.current) {
      tileCache.removeObstacle(boxObstacle.current);
      boxObstacle.current = undefined;
    }

    if (cylinderObstacle.current) {
      tileCache.removeObstacle(cylinderObstacle.current);
      cylinderObstacle.current = undefined;
    }

    const boxObstacleResult = tileCache.addBoxObstacle(
      boxObstacleTarget.current!.getWorldPosition(new Vector3()),
      { x: 1, y: 1, z: 1 },
      0.2
    );

    if (boxObstacleResult.success) {
      boxObstacle.current = boxObstacleResult.obstacle;
    }

    const cylinderObstacleResult = tileCache.addCylinderObstacle(
      cylinderObstacleTarget.current!.getWorldPosition(new Vector3()),
      1,
      0.5
    );

    if (cylinderObstacleResult.success) {
      cylinderObstacle.current = cylinderObstacleResult.obstacle;
    }

    let upToDate = false;
    while (!upToDate) {
      const result = tileCache.update(navMesh);
      upToDate = result.upToDate;
    }

    crowd.update(delta);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !navMeshQuery || !crowd || !agent) return;

    e.stopPropagation();

    if (e.button === 2) {
      agent.teleport(e.point);
    } else {
      agent.requestMoveTarget(e.point);
    }
  };

  return (
    <>
      <group onPointerDown={onClick}>
        <group ref={setGroup}>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#ccc" />
          </mesh>
        </group>
      </group>

      <PivotControls
        offset={[-2, 1, 1]}
        disableRotations
        activeAxes={[true, false, true]}
      >
        <object3D ref={boxObstacleTarget} position={[-2, 1, 1]} />
      </PivotControls>

      <PivotControls
        offset={[1.5, 0, -1.5]}
        disableRotations
        activeAxes={[true, false, true]}
      >
        <object3D ref={cylinderObstacleTarget} position={[1.5, 0, -1.5]} />
      </PivotControls>

      <Debug
        autoUpdate
        navMesh={navMesh}
        tileCache={tileCache}
        obstacleMaterial={obstaclesMaterial}
        crowd={crowd}
      />

      <OrbitControls makeDefault />
    </>
  );
};
