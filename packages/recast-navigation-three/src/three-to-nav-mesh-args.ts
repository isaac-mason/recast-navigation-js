import { BufferAttribute, Mesh, Vector3 } from 'three';

export const threeToNavMeshArgs = (meshes: Mesh[]) => {
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

  return { positions, indices };
};
