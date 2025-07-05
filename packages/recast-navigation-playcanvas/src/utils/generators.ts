import {
  SoloNavMeshGeneratorConfig,
  TileCacheGeneratorConfig,
  TiledNavMeshGeneratorConfig,
  generateSoloNavMesh,
  generateTileCache,
  generateTiledNavMesh,
} from '@recast-navigation/generators';
import { MeshInstance } from 'playcanvas';
import { getPositionsAndIndices } from './get-positions-and-indices';

export const pcToSoloNavMesh = (
  meshes: MeshInstance[],
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

export const pcToTiledNavMesh = (
  meshes: MeshInstance[],
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
  meshes: MeshInstance[],
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
