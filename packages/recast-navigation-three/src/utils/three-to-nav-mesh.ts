import {
  generateSoloNavMesh,
  generateTiledNavMesh,
  SoloNavMeshGeneratorConfig,
  TiledNavMeshGeneratorConfig
} from '@recast-navigation/core';
import { BufferAttribute, Mesh, Vector3 } from 'three';

const tmpVec3 = new Vector3();

export const getPositionsAndIndices = (
  meshes: Mesh[]
): [positions: Float32Array, indices: Uint32Array] => {
  const meshesToMerge: Mesh[] = [];

  let mergedPositionsLength = 0;
  let mergedIndicesLength = 0;

  for (const mesh of meshes) {
    const positionAttribute = mesh.geometry.attributes
      .position as BufferAttribute;

    if (!positionAttribute || positionAttribute.itemSize !== 3) {
      continue;
    }

    mergedPositionsLength += positionAttribute.array.length;

    mergedIndicesLength +=
      mesh.geometry.getIndex()?.array.length ??
      positionAttribute.array.length / 3;

    meshesToMerge.push(mesh);
  }

  const mergedPositions = new Float32Array(mergedPositionsLength);
  const mergedIndices = new Uint32Array(mergedIndicesLength);

  let indicesOffset = 0;
  let positionsOffset = 0;

  for (const mesh of meshesToMerge) {
    const positionAttribute = mesh.geometry.attributes
      .position as BufferAttribute;
    const positionArray = positionAttribute.array;

    const position = tmpVec3;
    for (let pt = 0; pt < positionArray.length; pt += 3) {
      position.set(
        positionArray[pt],
        positionArray[pt + 1],
        positionArray[pt + 2]
      );
      mesh.localToWorld(position);

      mergedPositions[pt + positionsOffset] = position.x;
      mergedPositions[pt + positionsOffset + 1] = position.y;
      mergedPositions[pt + positionsOffset + 2] = position.z;
    }

    const index = mesh.geometry.getIndex()?.array;

    if (index) {
      for (let tri = 0; tri < index.length; tri++) {
        mergedIndices[tri + indicesOffset] = index[tri] + indicesOffset;
      }
    } else {
      for (let i = 0; i < positionArray.length / 3; i++) {
        mergedIndices[i + indicesOffset] = i + indicesOffset;
      }
    }

    positionsOffset += positionArray.length;
    indicesOffset += positionArray.length / 3;
  }

  for (let i = 0; i < mergedIndices.length; i += 3) {
    const tmp = mergedIndices[i];
    mergedIndices[i] = mergedIndices[i + 2];
    mergedIndices[i + 2] = tmp;
  }

  return [mergedPositions, mergedIndices];
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
