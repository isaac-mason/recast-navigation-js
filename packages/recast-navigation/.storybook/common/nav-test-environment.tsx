import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import React from 'react';
import { GLTF } from 'three-stdlib';

const assetUrl = 'nav_test.glb';

export const NavTestEnvironment = (props: Omit<ThreeElements['object3D'], 'args'>) => {
  const gltf = useGLTF(assetUrl) as GLTF;

  return <primitive object={gltf.scene} {...props} />;
};

useGLTF.preload(assetUrl);
