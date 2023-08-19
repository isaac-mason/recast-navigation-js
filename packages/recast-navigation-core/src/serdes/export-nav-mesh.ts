import { NavMesh } from '../detour-nav-mesh';
import { TileCache } from '../detour-tile-cache';
import { Raw } from '../raw';

export const exportNavMesh = (
  navMesh: NavMesh,
  tileCache?: TileCache
): Uint8Array => {
  const navMeshExport = Raw.NavMeshExporter.exportNavMesh(
    navMesh.raw,
    tileCache?.raw!
  );

  const arrView = new Uint8Array(
    Raw.Module.HEAPU8.buffer,
    navMeshExport.dataPointer,
    navMeshExport.size
  );

  const data = new Uint8Array(navMeshExport.size);
  data.set(arrView);
  Raw.NavMeshExporter.freeNavMeshExport(navMeshExport);

  return data;
};
