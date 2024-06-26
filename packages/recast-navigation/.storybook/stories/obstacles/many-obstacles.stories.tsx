import { Line, OrbitControls } from '@react-three/drei';
import {
  Detour,
  NavMesh,
  NavMeshQuery,
  Raw,
  TileCache,
  statusDetail,
  statusToReadableString,
} from '@recast-navigation/core';
import { threeToTileCache } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh, MeshBasicMaterial, Vector3, Vector3Tuple } from 'three';
import { Debug } from '../../common/debug';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'TileCache / Many Obstacles',
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

export const ManyObstacles = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [tileCache, setTileCache] = useState<TileCache | undefined>();

  const [path, setPath] = useState<Vector3Tuple[]>();

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

    const boxObstacleSize = new Vector3(0.3, 1, 0.3);
    const addCylinderObstacleRadius = 0.3;

    const fullTileCacheUpdate = () => {
      let upToDate = false;
      while (!upToDate) {
        const result = tileCache.update(navMesh);
        upToDate = result.upToDate;

        console.log(
          'tileCache.update status:',
          statusToReadableString(result.status)
        );
      }
    };

    let obstacles = 0;
    for (let x = -10; x < 10; x += 2) {
      for (let z = -10; z < 10; z += 2) {
        obstacles += 1;

        const obstaclePosition = new Vector3(x, 0, z);

        const createObstacle = () => {
          if (obstacles % 2 === 0) {
            return tileCache.addBoxObstacle(
              obstaclePosition,
              boxObstacleSize,
              0.2
            );
          } else {
            return tileCache.addCylinderObstacle(
              obstaclePosition,
              addCylinderObstacleRadius,
              1
            );
          }
        };

        const result = createObstacle();

        if (
          !result.success &&
          statusDetail(result.status, Detour.DT_BUFFER_TOO_SMALL)
        ) {
          fullTileCacheUpdate();

          createObstacle();
        }
      }
    }

    fullTileCacheUpdate();

    const { point: start } = navMeshQuery.findClosestPoint({
      x: -8,
      y: 0,
      z: 10,
    });

    const { point: end } = navMeshQuery.findClosestPoint({
      x: 8,
      y: 0,
      z: -10,
    });

    const { path } = navMeshQuery.computePath(start, end);

    setPath(path ? path.map((v) => [v.x, v.y, v.z]) : undefined);

    setNavMesh(navMesh);
    setTileCache(tileCache);

    return () => {
      setNavMesh(undefined);
      setTileCache(undefined);

      navMesh.destroy();
      tileCache.destroy();
      navMeshQuery.destroy();
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[25, 25]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
      </group>

      {path && <Line points={path} color={'orange'} lineWidth={10} />}

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
