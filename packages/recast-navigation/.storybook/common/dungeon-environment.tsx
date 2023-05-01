import { useGLTF } from '@react-three/drei';
import React from 'react';
import { GLTF } from 'three-stdlib';

const assetUrl = 'dungeon.gltf';

export const DungeonEnvirionment = () => {
  const gltf = useGLTF(assetUrl) as GLTF;

  return <primitive object={gltf.scene} />;
};

useGLTF.preload(assetUrl);
