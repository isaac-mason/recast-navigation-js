import {
  generateSoloNavMesh,
  generateTiledNavMesh,
  SoloNavMeshGeneratorConfig,
  TiledNavMeshGeneratorConfig,
} from '@recast-navigation/core';
import { BufferAttribute, Mesh, Vector3 } from 'three';

const tmpVec3 = new Vector3();

export const getPositionsAndIndices = (
  meshes: Mesh[]
): [positions: Float32Array, indices: Uint32Array] => {
  const meshesToMerge: Mesh[] = [];

  for (const mesh of meshes) {
    const positionAttribute = mesh.geometry.attributes
      .position as BufferAttribute;

    if (!positionAttribute || positionAttribute.itemSize !== 3) {
      continue;
    }

    let meshToMerge = mesh;
    let index: ArrayLike<number> | undefined = mesh.geometry.getIndex()?.array;

    if (!index) {
      meshToMerge = meshToMerge.clone();
      meshToMerge.geometry = mesh.geometry.clone();

      // this will become indexed when merging with other meshes
      const ascendingIndex: number[] = [];
      for (let i = 0; i < positionAttribute.count; i++) {
        ascendingIndex.push(i);
      }

      meshToMerge.geometry.setIndex(ascendingIndex);
    }

    meshesToMerge.push(meshToMerge);
  }

  const mergedPositions: number[] = [];
  const mergedIndices: number[] = [];

  const positionToIndex: { [hash: string]: number } = {};
  let indexCounter = 0;

  for (const mesh of meshesToMerge) {
    mesh.updateMatrixWorld();

    const positions = mesh.geometry.attributes.position.array;
    const index = mesh.geometry.getIndex()!.array;

    for (let i = 0; i < index.length; i++) {
      const pt = index[i] * 3;

      const pos = tmpVec3.set(
        positions[pt],
        positions[pt + 1],
        positions[pt + 2]
      );
      mesh.localToWorld(pos);

      const key = `${pos.x}_${pos.y}_${pos.z}`;
      let idx = positionToIndex[key];

      if (!idx) {
        positionToIndex[key] = idx = indexCounter;
        mergedPositions.push(pos.x, pos.y, pos.z);
        indexCounter++;
      }

      mergedIndices.push(idx);
    }
  }

  return [Float32Array.from(mergedPositions), Uint32Array.from(mergedIndices)];
};

export const threeToSoloNavMesh = (
  meshes: Mesh[],
  navMeshGeneratorConfig: Partial<SoloNavMeshGeneratorConfig> = {},
  keepIntermediates = false
) => {
  const [positions, indices] = getPositionsAndIndices(meshes);

  return generateSoloNavMesh(
    positions,
    indices,
    navMeshGeneratorConfig,
    keepIntermediates
  );
};

export const threeToTiledNavMesh = (
  meshes: Mesh[],
  navMeshGeneratorConfig: Partial<TiledNavMeshGeneratorConfig> = {},
  keepIntermediates = false
) => {
  const [positions, indices] = getPositionsAndIndices(meshes);

  return generateTiledNavMesh(
    positions,
    indices,
    navMeshGeneratorConfig,
    keepIntermediates
  );
};
