import { type RecastConfig, exportNavMesh, init } from '@recast-navigation/core';
import { generateSoloNavMesh } from '@recast-navigation/generators';

self.onmessage = async (event: {
  data: {
    positions: Float32Array;
    indices: Uint32Array;
    config: Partial<RecastConfig>;
  };
}) => {
  await init();

  const { positions, indices, config } = event.data;

  const { success, navMesh } = generateSoloNavMesh(positions, indices, config);

  if (!success) return;

  const navMeshExport = exportNavMesh(navMesh);

  self.postMessage(navMeshExport, { transfer: [navMeshExport.buffer] });

  navMesh.destroy();
};
