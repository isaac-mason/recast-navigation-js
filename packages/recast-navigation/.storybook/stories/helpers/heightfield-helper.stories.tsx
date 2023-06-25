import { OrbitControls } from '@react-three/drei';
import { array } from '@recast-navigation/core';
import {
  HeightfieldHelper,
  threeToTiledNavMesh,
} from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import { NavTestEnvirionment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';

export default {
  title: 'Helpers / Heightfield Helper',
  decorators,
};

export const HeightfieldHelperExample = () => {
  const [group, setGroup] = useState<Group | null>(null);

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

    const { intermediates } = threeToTiledNavMesh(meshes, config, true);

    const heightfields = array(
      (i) => intermediates!.intermediates(i).heightfield(),
      intermediates!.intermediatesCount()
    );

    const heightfieldHelper = new HeightfieldHelper({
      heightfields,
      material: new MeshStandardMaterial(),
      highlightWalkable: true,
    });
    heightfieldHelper.updateHeightfield();

    setHeightfieldHelper(heightfieldHelper);

    return () => {
      setHeightfieldHelper(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup} visible={false}>
        <NavTestEnvirionment />
      </group>

      {heightfieldHelper && (
        <primitive object={heightfieldHelper.heightfields} />
      )}

      <OrbitControls />
    </>
  );
};
