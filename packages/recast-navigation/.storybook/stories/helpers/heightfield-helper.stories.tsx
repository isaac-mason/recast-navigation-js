import { NavMesh, array } from '@recast-navigation/core';
import {
  HeightfieldHelper,
  threeToSoloNavMesh,
  threeToTiledNavMesh,
} from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import {
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvirionment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';
import { OrbitControls } from '@react-three/drei';

export default {
  title: 'Helpers / Heightfield Helper',
  decorators,
};

export const HeightfieldHelperExample = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [heightfieldHelper, setHeightfieldHelper] = useState<
    HeightfieldHelper | undefined
  >();

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
      tileSize: 16,
    };

    const { navMesh, intermediates } = threeToTiledNavMesh(
      meshes,
      config,
      true
    );

    const heightfields = array(
      (i) => intermediates!.intermediates(i).heightfield(),
      intermediates!.intermediatesCount()
    );

    console.log((heightfields[0].raw as any).ptr);

    const heightfieldHelper = new HeightfieldHelper({
      heightfields,
      material: new MeshStandardMaterial(),
      highlightWalkable: true,
    });
    heightfieldHelper.updateHeightfield();

    setNavMesh(navMesh);
    setHeightfieldHelper(heightfieldHelper);

    return () => {
      setNavMesh(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup} visible={false}>
        <NavTestEnvirionment />
      </group>

      {heightfieldHelper && (
        <primitive object={heightfieldHelper.heightfield} />
      )}

      <OrbitControls />
    </>
  );
};
