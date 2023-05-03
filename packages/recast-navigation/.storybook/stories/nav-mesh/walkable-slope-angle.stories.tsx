import { Bounds, OrbitControls, Text } from '@react-three/drei';
import { NavMesh } from '@recast-navigation/core';
import { threeToNavMesh } from '@recast-navigation/three';
import { useControls } from 'leva';
import React, { useEffect, useState } from 'react';
import { Group, Mesh } from 'three';
import { DEG2RAD } from 'three/src/math/MathUtils';
import { Debug } from '../../common/debug';
import { decorators } from '../../decorators';

export default {
  title: 'NavMesh / Walkable Slope',
  decorators,
};

const DEGREES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];

const ANGLES = DEGREES.map((angle, idx) => ({
  degrees: angle,
  rad: angle * DEG2RAD,
  position: [(-DEGREES.length * 3) / 2 + idx * 3, 0, 0] as const,
}));

export const WalkableSlope = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();

  const { walkableSlopeAngle } = useControls('walkable-slope-angle', {
    walkableSlopeAngle: {
      value: 24,
      step: 1,
      min: 5,
      max: 50,
    },
  });

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const { navMesh } = threeToNavMesh(meshes, {
      cs: 0.1,
      ch: 0.1,
      walkableSlopeAngle,
    });

    setNavMesh(navMesh);

    return () => {
      setNavMesh(undefined);
    };
  }, [group, walkableSlopeAngle]);

  return (
    <>
      <Bounds fit observe>
        {ANGLES.map(({ degrees, position }) => (
          <Text key={degrees} position={[position[0], 3, -3]}>
            {degrees}°
          </Text>
        ))}

        <group ref={setGroup}>
          {ANGLES.map(({ degrees, rad, position }) => (
            <mesh key={degrees} rotation-x={rad} position={position}>
              <boxGeometry args={[2, 0.1, 5]} />
              <meshBasicMaterial color="#ccc" />
            </mesh>
          ))}
        </group>
      </Bounds>

      <Debug navMesh={navMesh} />

      <OrbitControls makeDefault />
    </>
  );
};
