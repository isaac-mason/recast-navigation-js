import {
  SoloNavMeshGeneratorConfig,
  TileCacheGeneratorConfig,
  TiledNavMeshGeneratorConfig,
  generateSoloNavMesh,
  generateTileCache,
  generateTiledNavMesh,
} from '@recast-navigation/generators';
import { Mesh } from 'three';
import { getPositionsAndIndices } from './get-positions-and-indices';

export const threeToSoloNavMesh = (
  meshes: Mesh[],
  navMeshGeneratorConfig: Partial<SoloNavMeshGeneratorConfig> = {},
  keepIntermediates = false,
) => {
  const [positions, indices] = getPositionsAndIndices(meshes);

  return generateSoloNavMesh(
    positions,
    indices,
    navMeshGeneratorConfig,
    keepIntermediates,
  );
};

export const threeToTiledNavMesh = (
  meshes: Mesh[],
  navMeshGeneratorConfig: Partial<TiledNavMeshGeneratorConfig> = {},
  keepIntermediates = false,
) => {
  const [positions, indices] = getPositionsAndIndices(meshes);

  return generateTiledNavMesh(
    positions,
    indices,
    navMeshGeneratorConfig,
    keepIntermediates,
  );
};

export const threeToTileCache = (
  meshes: Mesh[],
  navMeshGeneratorConfig: Partial<TileCacheGeneratorConfig> = {},
  keepIntermediates = false,
) => {
  const [positions, indices] = getPositionsAndIndices(meshes);

  return generateTileCache(
    positions,
    indices,
    navMeshGeneratorConfig,
    keepIntermediates,
  );
};
