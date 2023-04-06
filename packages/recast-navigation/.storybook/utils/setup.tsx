import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React from 'react';

export type SetupProps = {
  children: React.ReactNode;
};

export const Setup = ({ children }: SetupProps) => {
  return (
    <Canvas
      camera={{ position: [0, 10, 10], fov: 50 }}
      style={{
        width: '100%',
        height: '100vh',
        background: '#222',
      }}
    >
      {children}

      <OrbitControls />

      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.25} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
    </Canvas>
  );
};
