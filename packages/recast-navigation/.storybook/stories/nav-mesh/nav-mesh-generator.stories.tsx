import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { NavMesh } from '@recast-navigation/core';
import { threeToNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh, MeshBasicMaterial } from 'three';
import { Debug } from '../../common/debug';
import { DungeonEnvirionment } from '../../common/dungeon-environment';
import { NavTestEnvirionment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';

export default {
  title: 'NavMesh / NavMeshGenerator',
  decorators,
};

const navMeshMaterial = new MeshBasicMaterial({
  wireframe: true,
  color: 'red',
});

const Levels = {
  Dungeon: {
    Environment: DungeonEnvirionment,
    camera: {
      position: [-100, 75, -75] as const,
      lookAt: [15, 15, -51] as const,
    },
  },
  NavTest: {
    Environment: NavTestEnvirionment,
    camera: {
      position: [-10, 15, 10] as const,
      lookAt: [0, 0, 0] as const,
    },
  },
};

type CommonProps = {
  level: typeof Levels[keyof typeof Levels];
  tileSize?: number;
};

const Common = ({ level, tileSize }: CommonProps) => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();

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
      tileSize,
    });

    setNavMesh(navMesh);

    return () => {
      setNavMesh(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <level.Environment />
      </group>

      <Debug navMesh={navMesh} navMeshMaterial={navMeshMaterial} />

      <OrbitControls target={level.camera.lookAt} />

      <PerspectiveCamera makeDefault position={level.camera.position} />
    </>
  );
};

export const NavTest_SoloNavMesh = () => <Common level={Levels.NavTest} />;

export const NavTest_TiledNavMesh = () => (
  <Common level={Levels.NavTest} tileSize={16} />
);

export const Dungeon_SoloNavMesh = () => <Common level={Levels.Dungeon} />;

export const Dungeon_TiledNavMesh = () => (
  <Common level={Levels.Dungeon} tileSize={32} />
);
