import { mergePositionsAndIndices } from '@recast-navigation/generators';
import { type BufferAttribute, type Mesh, Vector3 } from 'three';

const _position = new Vector3();

export const getPositionsAndIndices = (
  meshes: Mesh[],
): [positions: Float32Array, indices: Uint32Array] => {
  const toMerge: {
    positions: ArrayLike<number>;
    indices: ArrayLike<number>;
  }[] = [];

  for (const mesh of meshes) {
    const positionAttribute = mesh.geometry.attributes
      .position as BufferAttribute;

    if (!positionAttribute || positionAttribute.itemSize !== 3) {
      continue;
    }

    mesh.updateMatrixWorld();

    const positions = new Float32Array(positionAttribute.array);

    for (let i = 0; i < positions.length; i += 3) {
      const pos = _position.set(
        positions[i],
        positions[i + 1],
        positions[i + 2],
      );
      mesh.localToWorld(pos);
      positions[i] = pos.x;
      positions[i + 1] = pos.y;
      positions[i + 2] = pos.z;
    }

    let indices: ArrayLike<number> | undefined =
      mesh.geometry.getIndex()?.array;

    if (indices === undefined) {
      // this will become indexed when merging with other meshes
      const ascendingIndex: number[] = [];
      for (let i = 0; i < positionAttribute.count; i++) {
        ascendingIndex.push(i);
      }
      indices = ascendingIndex;
    }

    toMerge.push({
      positions,
      indices,
    });
  }

  return mergePositionsAndIndices(toMerge);
};
