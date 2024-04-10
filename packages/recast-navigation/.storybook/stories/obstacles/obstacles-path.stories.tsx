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
  title: 'TileCache / Obstacles',
  decorators,
  parameters,
};

const navMeshMaterial = new MeshBasicMaterial({
  color: 'blue',
  wireframe: true,
});

const obstaclesMaterial = new MeshBasicMaterial({
  color: 'red',
  wireframe: true,
});

export const PathExample = () => {
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

    const navMeshQuery = new NavMeshQuery({ navMesh });

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

    console.log('box', boxObstacle.current)
    if (boxObstacle.current) {
      console.log('removeObstacle')
      const status = tileCache.removeObstacle(boxObstacle.current);

      console.log(status);

      boxObstacle.current = undefined;
    }

    const addObstacleResult = tileCache.addBoxObstacle(
      boxObstacleTarget.current!.getWorldPosition(new Vector3()),
      { x: 1, y: 1, z: 1 },
      0.2
    );

    if (addObstacleResult.success) {
      boxObstacle.current = addObstacleResult.obstacle;
    }

    let upToDate = false;
    while (!upToDate) {
      const result = tileCache.update(navMesh);
      upToDate = result.upToDate;
    }

    const path = navMeshQuery.computePath(
      navMeshQuery.getClosestPoint({
        x: -8,
        y: 0,
        z: 8,
      }),
      navMeshQuery.getClosestPoint({
        x: 8,
        y: 0,
        z: -8,
      })
    );

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
        navMeshMaterial={navMeshMaterial}
        tileCache={tileCache}
        obstacleMaterial={obstaclesMaterial}
      />

      <OrbitControls makeDefault />
    </>
  );
};
