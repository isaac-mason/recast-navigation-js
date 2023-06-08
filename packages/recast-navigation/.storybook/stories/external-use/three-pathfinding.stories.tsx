import { Line, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import React, { useEffect, useState } from 'react';
import { NavMesh } from 'recast-navigation';
import { threeToNavMesh } from 'recast-navigation/three';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  Vector2,
  Vector3,
} from 'three';
import { Pathfinding } from 'three-pathfinding';
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib';
import { decorators } from '../../decorators';

export default {
  title: 'External Use / Three Pathfinding',
  decorators,
};

const navMeshToPositionsAndIndices = (navMesh: NavMesh) => {
  const positions: number[] = [];
  const indices: number[] = [];
  let tri = 0;

  const maxTiles = navMesh.getMaxTiles();

  for (let tileIndex = 0; tileIndex < maxTiles; tileIndex++) {
    const tile = navMesh.getTile(tileIndex);
    const tileHeader = tile.header();

    if (!tileHeader) continue;

    const tilePolyCount = tileHeader.polyCount();

    for (
      let tilePolyIndex = 0;
      tilePolyIndex < tilePolyCount;
      ++tilePolyIndex
    ) {
      const poly = tile.polys(tilePolyIndex);

      if (poly.getType() === 1) continue;

      const polyVertCount = poly.vertCount();
      const polyDetail = tile.detailMeshes(tilePolyIndex);
      const polyDetailTriBase = polyDetail.triBase();
      const polyDetailTriCount = polyDetail.triCount();

      for (
        let polyDetailTriIndex = 0;
        polyDetailTriIndex < polyDetailTriCount;
        ++polyDetailTriIndex
      ) {
        const detailTrisBaseIndex =
          (polyDetailTriBase + polyDetailTriIndex) * 4;

        for (let trianglePoint = 0; trianglePoint < 3; ++trianglePoint) {
          if (
            tile.detailTris(detailTrisBaseIndex + trianglePoint) < polyVertCount
          ) {
            const tileVertsBaseIndex =
              poly.verts(tile.detailTris(detailTrisBaseIndex + trianglePoint)) *
              3;

            positions.push(
              tile.verts(tileVertsBaseIndex),
              tile.verts(tileVertsBaseIndex + 1),
              tile.verts(tileVertsBaseIndex + 2)
            );
          } else {
            const tileVertsBaseIndex =
              (polyDetail.vertBase() +
                tile.detailTris(detailTrisBaseIndex + trianglePoint) -
                poly.vertCount()) *
              3;

            positions.push(
              tile.detailVerts(tileVertsBaseIndex),
              tile.detailVerts(tileVertsBaseIndex + 1),
              tile.detailVerts(tileVertsBaseIndex + 2)
            );
          }

          indices.push(tri++);
        }
      }
    }
  }

  return [positions, indices];
};

export const ThreePathfinding = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMeshGeometry, setNavMeshGeometry] = useState<
    BufferGeometry | undefined
  >();

  const [path, setPath] = useState<Vector3[]>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const { navMesh } = threeToNavMesh(meshes, {
      cs: 0.02,
      ch: 0.2,
      walkableHeight: 1,
      walkableClimb: 2.5,
      walkableRadius: 1,
      borderSize: 0.2,
      tileSize: 32,
    });

    const [positions, indices] = navMeshToPositionsAndIndices(navMesh);

    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(positions), 3)
    );
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));

    const pathfinding = new Pathfinding();
    const ZONE = 'level';
    pathfinding.setZoneData(ZONE, Pathfinding.createZone(geometry, 1e-6));

    const start = {
      x: -1.5,
      y: 0,
      z: 1.5,
    };
    const startGroupId = pathfinding.getGroup(ZONE, start, true);

    const end = {
      x: 1.5,
      y: 0,
      z: -1.5,
    };

    const path: Vector3[] = pathfinding.findPath(
      start,
      end,
      ZONE,
      startGroupId
    );

    setNavMeshGeometry(geometry);
    setPath(path);

    return () => {
      setNavMeshGeometry(undefined);
      setPath(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[5, 0.25, 5]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>

        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </group>

      {navMeshGeometry && (
        <mesh>
          <meshBasicMaterial color="red" wireframe />
          <primitive attach="geometry" object={navMeshGeometry} />
        </mesh>
      )}

      {path && <Line points={path} color={'orange'} lineWidth={10} />}

      <OrbitControls />

      <PerspectiveCamera makeDefault position={[5, 8, 5]} />
    </>
  );
};
