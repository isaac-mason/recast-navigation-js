import { Line, OrbitControls, PivotControls } from '@react-three/drei';
import {
  BoxObstacle,
  NavMesh,
  NavMeshQuery,
  TileCache,
} from '@recast-navigation/core';
import { threeToTileCache } from '@recast-navigation/three';
import React, { useEffect, useRef, useState } from 'react';
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
  Vector3Tuple,
} from 'three';
import { Debug } from '../../common/debug';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'TileCache / Path Obstacles',
  decorators,
  parameters,
};

const obstaclesMaterial = new MeshBasicMaterial({
  color: 'red',
  wireframe: true,
});

export const PathObstacles = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery | undefined>();
  const [tileCache, setTileCache] = useState<TileCache | undefined>();

  const [path, setPath] = useState<Vector3Tuple[]>();

  const boxObstacle = useRef<BoxObstacle | undefined>();

  const boxObstacleTarget = useRef<Object3D | null>(null!);

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

    const navMeshQuery = new NavMeshQuery(navMesh);

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);
    setTileCache(tileCache);

    return () => {
      setNavMesh(undefined);
      setNavMeshQuery(undefined);
      setTileCache(undefined);

      navMesh.destroy();
      tileCache.destroy();
      navMeshQuery.destroy();
    };
  }, [group]);

  const update = () => {
    if (!navMesh || !tileCache || !navMeshQuery) return;

    if (boxObstacle.current) {
      const { success } = tileCache.removeObstacle(boxObstacle.current);

      if (success) {
        boxObstacle.current = undefined;
      }
    }

    if (!boxObstacle.current) {
      const addObstacleResult = tileCache.addBoxObstacle(
        boxObstacleTarget.current!.getWorldPosition(new Vector3()),
        { x: 1, y: 1, z: 1 },
        0.2
      );

      if (addObstacleResult.success) {
        boxObstacle.current = addObstacleResult.obstacle;
      }
    }

    let upToDate = false;
    while (!upToDate) {
      const result = tileCache.update(navMesh);
      upToDate = result.upToDate;
    }

    const { point: start } = navMeshQuery.findClosestPoint({
      x: -8,
      y: 0,
      z: 8,
    });

    const { point: end } = navMeshQuery.findClosestPoint({
      x: 8,
      y: 0,
      z: -8,
    });

    const { path } = navMeshQuery.computePath(start, end);

    setPath(path ? path.map((v) => [v.x, v.y, v.z]) : undefined);
  };

  useEffect(() => {
    update();
  }, [navMesh]);

  return (
    <>
      <group ref={setGroup}>
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
      </group>

      {path && <Line points={path} color={'orange'} lineWidth={10} />}

      <PivotControls
        offset={[-2, 1, 1]}
        disableRotations
        activeAxes={[true, false, true]}
        onDrag={update}
      >
        <object3D ref={boxObstacleTarget} position={[-2, 1, 1]} />
      </PivotControls>

      <Debug
        autoUpdate
        navMesh={navMesh}
        tileCache={tileCache}
        obstacleMaterial={obstaclesMaterial}
      />

      <OrbitControls makeDefault />
    </>
  );
};
