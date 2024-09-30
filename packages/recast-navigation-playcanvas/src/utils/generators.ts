import {
  SoloNavMeshGeneratorConfig,
  TileCacheGeneratorConfig,
  TiledNavMeshGeneratorConfig,
  generateSoloNavMesh,
  generateTileCache,
  generateTiledNavMesh
} from '@recast-navigation/generators';
import { MeshInstance, GraphicsDevice } from 'playcanvas';
import { getPositionsAndIndices } from './get-positions-and-indices';

export const pcToSoloNavMesh = (
  graphicsDevice: GraphicsDevice,
  meshes: MeshInstance[],
  navMeshGeneratorConfig: Partial<SoloNavMeshGeneratorConfig> = {},
  keepIntermediates = false
) => {
  const [positions, indices] = getPositionsAndIndices(graphicsDevice, meshes);

  return generateSoloNavMesh(
    positions,
    indices,
    navMeshGeneratorConfig,
    keepIntermediates
  );
};

export const pcToTiledNavMesh = (
  graphicsDevice: GraphicsDevice,
  meshes: MeshInstance[],
  navMeshGeneratorConfig: Partial<TiledNavMeshGeneratorConfig> = {},
  keepIntermediates = false
) => {
  const [positions, indices] = getPositionsAndIndices(graphicsDevice, meshes);

  return generateTiledNavMesh(
    positions,
    indices,
    navMeshGeneratorConfig,
    keepIntermediates
  );
};

export const threeToTileCache = (
  graphicsDevice: GraphicsDevice,
  meshes: MeshInstance[],
  navMeshGeneratorConfig: Partial<TileCacheGeneratorConfig> = {},
  keepIntermediates = false
) => {
  const [positions, indices] = getPositionsAndIndices(graphicsDevice, meshes);

  return generateTileCache(
    positions,
    indices,
    navMeshGeneratorConfig,
    keepIntermediates
  );
};
