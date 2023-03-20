import { Environment, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Box3, Group, PerspectiveCamera, Vector3 } from 'three';

export type ViewerProps = {
  scene: Group;
};

export const Viewer = ({ scene }: ViewerProps) => {
  const camera = useThree((state) => state.camera as PerspectiveCamera);

  const initialCameraPosition = useMemo(() => {
    const box = new Box3();
    box.expandByObject(scene);
    const center = box.getCenter(new Vector3());

    return [center.x, box.max.y * 1.5, center.z] as const;
  }, [scene]);

  useEffect(() => {
    camera.position.set(...initialCameraPosition);
  }, []);

  return (
    <>
      <primitive object={scene} />

      <Environment preset="city" />

      <OrbitControls />
    </>
  );
};
