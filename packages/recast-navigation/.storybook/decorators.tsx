import { init } from '@recast-navigation/core';
import React, { Suspense } from 'react';
import { suspend } from 'suspend-react';

import { Environment, Loader } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';

type SetupProps = {
  children: React.ReactNode;
};

const Setup = ({ children }: SetupProps) => {
  return (
    <>
      <Canvas
        camera={{ position: [0, 10, 10], fov: 50 }}
        style={{
          width: '100%',
          height: '100vh',
          background: '#222',
        }}
      >
        <Suspense fallback={null}>{children}</Suspense>

        <Environment preset="city" />
      </Canvas>
      <Loader />
    </>
  );
};

export const decorators = [
  (Story: () => JSX.Element) => {
    suspend(() => init(), []);

    return <Story />;
  },
  (Story: () => JSX.Element) => (
    <Setup>
      <Story />
    </Setup>
  ),
  (Story: () => JSX.Element) => (
    <>
      <Story />
      <Leva
        theme={{
          sizes: {
            controlWidth: '100px',
          },
        }}
      />
    </>
  ),
];
