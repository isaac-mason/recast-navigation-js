import { OrbitControls, PivotControls } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  BoxObstacle,
  Crowd,
  CylinderObstacle,
  NavMesh,
  NavMeshQuery,
  TileCache,
} from '@recast-navigation/core';
import React, { useEffect, useRef, useState } from 'react';
import { threeToTiledNavMesh } from 'recast-navigation/three';
import { Group, Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';
import { Debug } from '../common/debug';
import { decorators } from '../decorators';

export default {
  title: 'TileCache / Obstacles',
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
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery | undefined>();
  const [tileCache, setTileCache] = useState<TileCache | undefined>();
  const [crowd, setCrowd] = useState<Crowd | undefined>();

  const boxObstacle = useRef<BoxObstacle | undefined>();
  const cylinderObstacle = useRef<CylinderObstacle | undefined>();

  const boxObstacleTarget = useRef<Object3D | null>(null!);
  const cylinderObstacleTarget = useRef<Object3D | null>(null!);

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const { navMesh, tileCache } = threeToTiledNavMesh(meshes, {
      ch: 0.05,
      cs: 0.1,
      tileSize: 32,
    });

    let upToDate = false;
    while (!upToDate) {
      const result = tileCache.update(navMesh);
      upToDate = result.upToDate;
    }

    const navMeshQuery = new NavMeshQuery({ navMesh });

    const crowd = new Crowd({
      navMesh,
      maxAgents: 1,
      maxAgentRadius: 0.2,
    });

    crowd.addAgent(navMeshQuery.getClosestPoint({ x: 0, y: 0, z: 0 }), {
      radius: 0.2,
      height: 1,
      maxAcceleration: 4.0,
      maxSpeed: 1.0,
      collisionQueryRange: 0.5,
      pathOptimizationRange: 0.0,
      separationWeight: 1.0,
    });

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);
    setTileCache(tileCache);
    setCrowd(crowd);

    return () => {
      setNavMesh(undefined);
      setNavMeshQuery(undefined);
      setTileCache(undefined);
      setCrowd(undefined);

      crowd.destroy();
      navMesh.destroy();
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowd || !navMesh || !tileCache) return;

    if (boxObstacle.current) {
      tileCache.removeObstacle(boxObstacle.current);
    }

    if (cylinderObstacle.current) {
      tileCache.removeObstacle(cylinderObstacle.current);
    }

    boxObstacle.current = tileCache.addBoxObstacle(
      boxObstacleTarget.current!.getWorldPosition(new Vector3()),
      { x: 1, y: 1, z: 1 },
      0.2
    );

    cylinderObstacle.current = tileCache.addCylinderObstacle(
      cylinderObstacleTarget.current!.getWorldPosition(new Vector3()),
      1,
      0.5
    );

    let upToDate = false;
    while (!upToDate) {
      const result = tileCache.update(navMesh);
      upToDate = result.upToDate;
    }

    crowd.update(delta);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !navMeshQuery || !crowd) return;

    const target = navMeshQuery.getClosestPoint(e.point);

    crowd.goto(0, target);
  };

  return (
    <>
      <group onClick={onClick}>
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
        navMesh={navMesh}
        navMeshMaterial={navMeshMaterial}
        tileCache={tileCache}
        obstacleMaterial={obstaclesMaterial}
        crowd={crowd}
      />

      <OrbitControls makeDefault />
    </>
  );
};
