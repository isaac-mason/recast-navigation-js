import { Environment, Loader } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as RecastNavigation from '@recast-navigation/core';
import { Leva } from 'leva';
import React, { Suspense } from 'react';
import { suspend } from 'suspend-react';
import tunnel from 'tunnel-rat'

export const htmlTunnel = tunnel();

const city = import('@pmndrs/assets/hdri/city.exr');

type SetupProps = {
  children: React.ReactNode;
};

const Setup = ({ children }: SetupProps) => {
  return (
    <div style={{ position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 10, 10], fov: 50 }}
        style={{
          width: '100%',
          height: '100vh',
          background: '#222',
        }}
      >
        <Suspense fallback={null}>{children}</Suspense>

        <Environment files={(suspend(city) as any).default} />
      </Canvas>
      <Loader />
      <htmlTunnel.Out />
    </div>
  );
};

export const decorators = [
  (Story: () => JSX.Element) => {
    suspend(async () => {
      await RecastNavigation.init()

      ;(window as any).RecastNavigation = RecastNavigation
    }, []);

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
