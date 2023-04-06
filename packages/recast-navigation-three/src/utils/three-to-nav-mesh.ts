import { NavMesh, NavMeshConfig } from '@recast-navigation/core';
import { BufferAttribute, Mesh, Object3D, Vector3 } from 'three';

export const threeToNavMeshArgs = (
  object: Object3D
): [positions: number[], indices: number[]] => {
  const meshes: Mesh[] = [];

  object.traverse((child) => {
    if (child instanceof Mesh) {
      meshes.push(child);
    }
  });

  let index: number;
  let tri: number;
  let pt: number;

  const indices: number[] = [];
  const positions: number[] = [];

  let offset = 0;
  for (index = 0; index < meshes.length; index++) {
    if (meshes[index]) {
      const mesh = meshes[index];

      const meshIndices = mesh.geometry.getIndex()?.array;
      if (!meshIndices) {
        // todo: to indexed?
        continue;
      }

      const meshPositions = (mesh.geometry.getAttribute(
        'position'
      ) as BufferAttribute)!.array;
      if (!meshPositions) {
        continue;
      }

      for (tri = 0; tri < meshIndices.length; tri++) {
        indices.push(meshIndices[tri] + offset);
      }

      const position = new Vector3();
      for (pt = 0; pt < meshPositions.length; pt += 3) {
        position.set(
          meshPositions[pt],
          meshPositions[pt + 1],
          meshPositions[pt + 2]
        );
        mesh.localToWorld(position);

        positions.push(position.x, position.y, position.z);
      }

      offset += meshPositions.length / 3;
    }
  }

  return [positions, indices];
};

export const threeToNavMesh = (
  object: Object3D,
  navMeshConfig: Partial<NavMeshConfig> = {}
): NavMesh => {
  const [positions, indices] = threeToNavMeshArgs(object);

  const navMesh = new NavMesh();
  navMesh.build(positions, indices, navMeshConfig);

  return navMesh;
};
