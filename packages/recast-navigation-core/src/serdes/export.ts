import { NavMesh } from '../nav-mesh';
import { TileCache } from '../tile-cache';
import { Raw } from '../raw';

const exportImpl = (navMesh: NavMesh, tileCache?: TileCache): Uint8Array => {
  const navMeshExport = Raw.NavMeshExporter.exportNavMesh(
    navMesh.raw,
    tileCache?.raw as never
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

export const exportNavMesh = (navMesh: NavMesh): Uint8Array => {
  return exportImpl(navMesh);
};

export const exportTileCache = (
  navMesh: NavMesh,
  tileCache: TileCache
): Uint8Array => {
  return exportImpl(navMesh, tileCache);
};
