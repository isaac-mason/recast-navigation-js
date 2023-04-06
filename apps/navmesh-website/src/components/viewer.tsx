import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Box3, Group, Mesh, PerspectiveCamera, Vector3 } from 'three';

export type ViewerProps = {
  group: Group;
};

export const Viewer = ({ group }: ViewerProps) => {
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera as PerspectiveCamera);

  useEffect(() => {
    const box = new Box3();

    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        box.expandByObject(obj);
      }
    });

    const center = box.getCenter(new Vector3());

    const initial = [center.x * 3, box.max.y * 2, center.z * 3] as const;

    camera.position.set(...initial);
  }, [group, scene]);

  return (
    <>
      <primitive object={group} />
    </>
  );
};
