import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { NavMesh } from '@recast-navigation/core';
import { threeToNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh } from 'three';
import { Debug } from '../components/debug';
import { DungeonEnvirionment } from '../components/dungeon-environment';
import { NavTestEnvirionment } from '../components/nav-test-environment';
import { decorators } from '../decorators';
import { createLineMesh } from '../utils/create-line-mesh';

export default {
  title: 'NavMesh Generation',
  decorators,
};

const Levels = {
  Dungeon: {
    Environment: DungeonEnvirionment,
    from: {
      x: -4.207291347964981,
      y: 9.998181343078613,
      z: -19.585846142566375,
    },
    to: { x: 19.77, y: 15, z: -74 },
    camera: {
      position: [-100, 75, -75] as const,
      lookAt: [15, 15, -51] as const,
    },
  },
  NavTest: {
    Environment: NavTestEnvirionment,
    from: { x: 0.57, y: 0.2, z: 1.55 },
    to: { x: -3, y: 2.32, z: 0.63 },
    camera: {
      position: [-10, 15, 10] as const,
      lookAt: [0, 0, 0] as const,
    },
  },
};

type CommonProps = {
  level: typeof Levels[keyof typeof Levels];
};

const Common = ({ level }: CommonProps) => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [pathLineMesh, setPathLineMesh] = useState<Mesh | undefined>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const navMesh = threeToNavMesh(meshes, {
      cs: 0.05,
      ch: 0.2,
      walkableHeight: 1,
      walkableClimb: 2.5,
      walkableRadius: 1,
      borderSize: 0.2,
    });

    const path = navMesh.computePath(level.from, level.to);

    const pathMesh = createLineMesh(path);

    setNavMesh(navMesh);
    setPathLineMesh(pathMesh);

    return () => {
      setNavMesh(undefined);
      setPathLineMesh(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <level.Environment />
      </group>

      {pathLineMesh && (
        <group position={[0, 0.2, 0]}>
          <primitive object={pathLineMesh} />
        </group>
      )}

      <Debug navMesh={navMesh} />

      <OrbitControls target={level.camera.lookAt} />

      <PerspectiveCamera makeDefault position={level.camera.position} />
    </>
  );
};

export const NavTest = () => <Common level={Levels.NavTest} />;

export const Dungeon = () => <Common level={Levels.Dungeon} />;
