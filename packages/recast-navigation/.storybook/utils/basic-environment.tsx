import { Addition, Base, Geometry } from '@react-three/csg';
import React from 'react';

export const BasicEnvironment = () => (
  <mesh>
    <Geometry useGroups>
      <Base rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="grey" />
      </Base>
      <Addition position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="white" />
      </Addition>
      <Addition position={[1.5, 0.5, 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="white" />
      </Addition>
      <Addition position={[-2, 0.5, -1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="white" />
      </Addition>
      <Addition position={[2, 0.5, -0.5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="white" />
      </Addition>
    </Geometry>
  </mesh>
);
