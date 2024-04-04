import type { ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import React from 'react';
import { GLTF } from 'three-stdlib';

const assetUrl = 'nav_test.glb';

export const NavTestEnvironment = (props: {
  onPointerUp?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}) => {
  const gltf = useGLTF(assetUrl) as GLTF;

  return (
    <primitive
      object={gltf.scene}
      onPointerUp={props.onPointerUp}
      onPointerDown={props.onPointerDown}
    />
  );
};

useGLTF.preload(assetUrl);
