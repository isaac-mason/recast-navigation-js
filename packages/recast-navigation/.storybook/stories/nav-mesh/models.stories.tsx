import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { NavMesh } from '@recast-navigation/core';
import {
  DebugDrawer,
  threeToSoloNavMesh,
  threeToTileCache,
  threeToTiledNavMesh,
} from '@recast-navigation/three';
import { useEffect, useState } from 'react';
import { type Group, Mesh } from 'three';
import { DungeonEnvironment } from '../../common/dungeon-environment';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'NavMesh / Models',
  decorators,
  parameters,
};

const Levels = {
  Dungeon: {
    Environment: DungeonEnvironment,
    camera: {
      position: [-100, 75, -75] as const,
      lookAt: [15, 15, -51] as const,
    },
  },
  NavTest: {
    Environment: NavTestEnvironment,
    camera: {
      position: [-10, 15, 10] as const,
      lookAt: [0, 0, 0] as const,
    },
  },
};

type CommonProps = {
  level: (typeof Levels)[keyof typeof Levels];
  type: 'solo' | 'tiled' | 'tilecache';
  tileSize?: number;
};

const Common = ({ level, type, tileSize }: CommonProps) => {
  const [group, setGroup] = useState<Group | null>(null);

  const [debugDrawer, setDebugDrawer] = useState<DebugDrawer | undefined>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const config = {
      cs: 0.05,
      ch: 0.2,
      walkableHeight: 1,
      walkableClimb: 2.5,
      walkableRadius: 1,
      borderSize: 0.2,
      tileSize,
    };

    let navMesh: NavMesh | undefined;

    if (type === 'solo') {
      const result = threeToSoloNavMesh(meshes, config, false);
      navMesh = result.navMesh;
    } else if (type === 'tiled') {
      const result = threeToTiledNavMesh(meshes, config, false);
      navMesh = result.navMesh;
    } else {
      const result = threeToTileCache(meshes, config);
      navMesh = result.navMesh;
    }

    const debugDrawer = new DebugDrawer();

    if (navMesh) {
      debugDrawer.drawNavMesh(navMesh);
    }

    setDebugDrawer(debugDrawer);

    return () => {
      setDebugDrawer(undefined);
    };
  }, [group, type, tileSize]);

  return (
    <>
      <group ref={setGroup}>
        <level.Environment />
      </group>

      {debugDrawer && <primitive object={debugDrawer} />}

      <OrbitControls target={level.camera.lookAt} />

      <PerspectiveCamera makeDefault position={level.camera.position} />
    </>
  );
};

export const NavTest_Solo = () => <Common type="solo" level={Levels.NavTest} />;

export const NavTest_Tiled = () => (
  <Common type="tiled" level={Levels.NavTest} tileSize={16} />
);

export const NavTest_TileCache = () => (
  <Common type="tilecache" level={Levels.NavTest} tileSize={16} />
);

export const Dungeon_Solo = () => <Common type="solo" level={Levels.Dungeon} />;

export const Dungeon_Tiled = () => (
  <Common type="tiled" level={Levels.Dungeon} tileSize={32} />
);

export const Dungeon_TileCache = () => (
  <Common type="tilecache" level={Levels.Dungeon} tileSize={32} />
);
