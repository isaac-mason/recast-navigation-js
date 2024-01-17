import { useMemo } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
} from 'three';

export const NavMeshGeneratorInputHelper = ({
  enabled,
  indexedTriangleMesh,
  navMeshGeneratorInputDebugColor,
  navMeshGeneratorInputWireframe,
  navMeshGeneratorInputOpacity,
}: {
  enabled: boolean;
  indexedTriangleMesh:
    | {
        positions: Float32Array;
        indices: Uint32Array;
      }
    | undefined;
  navMeshGeneratorInputDebugColor: string;
  navMeshGeneratorInputWireframe: boolean;
  navMeshGeneratorInputOpacity: number;
}) => {
  const helper = useMemo(() => {
    if (!indexedTriangleMesh) return undefined;

    const geometry = new BufferGeometry();

    geometry.setAttribute(
      'position',
      new BufferAttribute(indexedTriangleMesh.positions, 3)
    );
    geometry.setIndex(new BufferAttribute(indexedTriangleMesh.indices, 1));

    const mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({
        transparent: true,
        color: Number(navMeshGeneratorInputDebugColor.replace('#', '0x')),
        wireframe: navMeshGeneratorInputWireframe,
        opacity: navMeshGeneratorInputOpacity,
      })
    );

    return mesh;
  }, [
    indexedTriangleMesh,
    navMeshGeneratorInputDebugColor,
    navMeshGeneratorInputWireframe,
    navMeshGeneratorInputOpacity,
  ]);

  return enabled && helper && <primitive object={helper} />;
};
