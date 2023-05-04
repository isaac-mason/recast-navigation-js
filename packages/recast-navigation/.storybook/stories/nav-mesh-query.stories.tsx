import { OrbitControls } from '@react-three/drei';
import { NavMesh, NavMeshQuery } from '@recast-navigation/core';
import { threeToNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Color, Group, Mesh, MeshBasicMaterial, Vector2 } from 'three';
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib';
import { Debug } from '../common/debug';
import { NavTestEnvirionment } from '../common/nav-test-environment';
import { decorators } from '../decorators';

export default {
  title: 'NavMeshQuery / Compute Path',
  decorators,
};

const navMeshMaterial = new MeshBasicMaterial({
  wireframe: true,
  color: 'red',
});

export const ComputePathExample = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [pathLine, setPathLine] = useState<Line2 | undefined>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const { navMesh } = threeToNavMesh(meshes, {
      cs: 0.05,
      ch: 0.2,
      walkableHeight: 1,
      walkableClimb: 2.5,
      walkableRadius: 1,
      borderSize: 0.2,
    });

    const navMeshQuery = new NavMeshQuery({ navMesh });

    const path = navMeshQuery.computePath(
      navMeshQuery.getClosestPoint({
        x: -4.128927083678903,
        y: 0.2664172349988201,
        z: 4.8521110263641685,
      }),
      navMeshQuery.getClosestPoint({
        x: 2.0756323479723005,
        y: 2.38756142461898,
        z: -1.9437325288048717,
      })
    );

    const lineGeometry = new LineGeometry();
    lineGeometry.setPositions(path.flatMap((p) => [p.x, p.y, p.z]));
    lineGeometry.setColors(
      path.flatMap((_, idx) => {
        const color = new Color();
        color.setHSL(idx / path.length, 1, 0.5);
        return [color.r, color.g, color.b];
      })
    );

    const line = new Line2(
      lineGeometry,
      new LineMaterial({
        linewidth: 5, // in pixels
        vertexColors: true,
        resolution: new Vector2(window.innerWidth, window.innerHeight),
        dashed: true,
      })
    );

    setNavMesh(navMesh);
    setPathLine(line);

    return () => {
      setNavMesh(undefined);
      setPathLine(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvirionment />
      </group>

      {pathLine && <primitive object={pathLine} />}

      <Debug navMesh={navMesh} navMeshMaterial={navMeshMaterial} />

      <OrbitControls />
    </>
  );
};
