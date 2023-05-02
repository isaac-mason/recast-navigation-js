import {
  NavMeshConfig,
  NavMeshGenerator,
  NavMeshGeneratorResult,
} from '@recast-navigation/core';
import { BufferAttribute, Mesh, Vector3 } from 'three';

export const getPositionsAndIndices = (
  meshes: Mesh[]
): [positions: number[], indices: number[]] => {
  let index: number;
  let tri: number;
  let pt: number;

  const indices: number[] = [];
  const positions: number[] = [];

  let offset = 0;
  for (index = 0; index < meshes.length; index++) {
    if (meshes[index]) {
      const mesh = meshes[index];

      const meshPositions = (mesh.geometry.getAttribute(
        'position'
      ) as BufferAttribute)!.array;

      if (!meshPositions) {
        continue;
      }

      let meshIndices = mesh.geometry.getIndex()?.array;

      if (!meshIndices) {
        const indices = [];
        for (let i = 0; i < meshPositions.length / 3; i++) {
          indices.push(i);
        }
        meshIndices = indices;
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
  meshes: Mesh[],
  navMeshConfig: Partial<NavMeshConfig> = {}
): NavMeshGeneratorResult => {
  const [positions, indices] = getPositionsAndIndices(meshes);

  const navMeshGenerator = new NavMeshGenerator();

  return navMeshGenerator.generate(positions, indices, navMeshConfig);
};
