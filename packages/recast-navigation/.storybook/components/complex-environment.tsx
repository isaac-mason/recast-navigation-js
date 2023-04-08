import { useGLTF } from '@react-three/drei';
import React from 'react';
import { GLTF } from 'three-stdlib';

const dungeonUrl = 'level.glb';

export const ComplexEnvironment = () => {
  const gltf = useGLTF(dungeonUrl) as GLTF;

  return <primitive object={gltf.scene} />;
};

useGLTF.preload(dungeonUrl);
